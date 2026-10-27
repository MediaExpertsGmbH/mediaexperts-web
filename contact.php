<?php
// Media Experts — contact form endpoint (Infomaniak web hosting, PHP mail()).
// POST from assets/app.js. Sends the inquiry to info@ (Reply-To: the visitor) and the
// branded confirmation from email/autoresponder.* to the visitor. Answers JSON {ok, error?}.

declare(strict_types=1);

const TO         = 'info@mediaexperts.ch';
const FROM       = 'info@mediaexperts.ch';
const FROM_NAME  = 'Media Experts';
const PER_IP     = 3;    // messages per IP per hour
const PER_DAY    = 60;   // messages per day in total (protects the confirmation mail from abuse)
const MIN_SECS   = 3;    // a human needs at least this long to fill in the form
const TOPICS     = ['A project', 'GroundZero', 'Something else'];
const LANGS      = ['en', 'de', 'fr', 'it'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(int $code, array $body): void { http_response_code($code); echo json_encode($body); exit; }
function clean(string $s, int $max): string {
  $s = trim(preg_replace('/[\r\n\t]+/', ' ', $s) ?? '');   // no header injection through single-line fields
  return mb_substr($s, 0, $max);
}
function hdr(string $s): string { return '=?UTF-8?B?' . base64_encode($s) . '?='; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['ok' => false, 'error' => 'method']);

// same-site posts only
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !preg_match('#^https?://(www\.)?mediaexperts\.ch$#', $origin)) out(403, ['ok' => false, 'error' => 'origin']);

// bots: hidden field must stay empty, and the form must have been open a few seconds
if (($_POST['website'] ?? '') !== '') out(200, ['ok' => true]);   // pretend success, send nothing
$t = (int)($_POST['t'] ?? 0);
if ($t <= 0 || (time() - intdiv($t, 1000)) < MIN_SECS) out(400, ['ok' => false, 'error' => 'timing']);

$name    = clean((string)($_POST['name'] ?? ''), 100);
$email   = clean((string)($_POST['email'] ?? ''), 200);
$company = clean((string)($_POST['company'] ?? ''), 150);
$message = trim(mb_substr((string)($_POST['message'] ?? ''), 0, 5000));
$topic   = in_array($_POST['topic'] ?? '', TOPICS, true) ? $_POST['topic'] : 'Something else';
$lang    = in_array($_POST['lang'] ?? '', LANGS, true) ? $_POST['lang'] : 'en';

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) out(422, ['ok' => false, 'error' => 'invalid']);

// rate limits (files in the system temp dir, outside the website)
$dir = sys_get_temp_dir();
$now = time();
$ipFile = $dir . '/me-contact-' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '') . '.json';
$dayFile = $dir . '/me-contact-day-' . date('Ymd') . '.txt';
$hits = array_filter(json_decode(@file_get_contents($ipFile) ?: '[]', true) ?: [], fn($x) => $x > $now - 3600);
if (count($hits) >= PER_IP) out(429, ['ok' => false, 'error' => 'rate']);
if ((int)@file_get_contents($dayFile) >= PER_DAY) out(429, ['ok' => false, 'error' => 'rate']);

// 1. the inquiry, to us
$body = "New message from mediaexperts.ch\n\n"
      . "Topic:    $topic\n"
      . "Name:     $name\n"
      . "Email:    $email\n"
      . ($company !== '' ? "Company:  $company\n" : '')
      . "Language: " . strtoupper($lang) . "\n\n"
      . str_repeat('-', 40) . "\n\n"
      . $message . "\n";
$headers = implode("\r\n", [
  'From: ' . hdr(FROM_NAME . ' Website') . ' <' . FROM . '>',
  'Reply-To: ' . hdr($name) . ' <' . $email . '>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
]);
$sent = mail(TO, hdr("Website: $topic — $name"), $body, $headers, '-f' . FROM);
if (!$sent) out(502, ['ok' => false, 'error' => 'send']);

$hits[] = $now;
@file_put_contents($ipFile, json_encode(array_values($hits)), LOCK_EX);
@file_put_contents($dayFile, (string)((int)@file_get_contents($dayFile) + 1), LOCK_EX);

// 2. the branded confirmation, to the visitor (fixed content: nothing they typed is echoed back)
$html = @file_get_contents(__DIR__ . '/email/autoresponder.html');
$txt  = @file_get_contents(__DIR__ . '/email/autoresponder.txt');
if ($html && $txt) {
  $subject = 'Thanks for your message · Danke · Merci · Grazie — Media Experts';
  if (preg_match('/^Subject:\s*(.+)$/m', $txt, $m)) { $subject = trim($m[1]); $txt = ltrim(preg_replace('/^Subject:.*\R/m', '', $txt, 1)); }
  $b = 'me-' . bin2hex(random_bytes(8));
  $mime = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($txt))
        . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html))
        . "--$b--\r\n";
  $h2 = implode("\r\n", [
    'From: ' . hdr(FROM_NAME) . ' <' . FROM . '>',
    'Reply-To: ' . FROM,
    'Auto-Submitted: auto-replied',
    'MIME-Version: 1.0',
    "Content-Type: multipart/alternative; boundary=\"$b\"",
  ]);
  @mail($email, hdr($subject), $mime, $h2, '-f' . FROM);
}

out(200, ['ok' => true]);
