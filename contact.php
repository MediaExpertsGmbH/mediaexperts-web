<?php
// Media Experts — contact form endpoint (Infomaniak web hosting).
// POST from assets/app.js. Sends the inquiry to info@ (Reply-To: the visitor) and the
// branded confirmation from email/autoresponder.* to the visitor. Answers JSON {ok, error?}.
//
// Sending: authenticated SMTP (Infomaniak's recommended way) with the login from
// contact-config.php, a file that exists only on the server (never in git):
//   <?php return ['host' => 'mail.infomaniak.com', 'port' => 465,
//                 'user' => 'website@mediaexperts.ch', 'pass' => 'the mailbox password'];
// Without that file it falls back to PHP mail(), which Infomaniak switches off by default.

declare(strict_types=1);

ini_set('display_errors', '0');   // never show PHP errors (paths, config) to visitors; they go to the error log

const TO         = 'info@mediaexperts.ch';
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

/** Minimal SMTPS client (implicit TLS, AUTH LOGIN). Returns true when the server accepted the message. */
function smtp_send(array $c, string $to, string $subject, string $headers, string $body): bool {
  $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
  $fp = @stream_socket_client('ssl://' . $c['host'] . ':' . (int)$c['port'], $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) { error_log("contact.php smtp connect: $errstr"); return false; }
  stream_set_timeout($fp, 15);
  $read = function () use ($fp): string {
    $data = '';
    while (($line = fgets($fp, 515)) !== false) { $data .= $line; if (strlen($line) < 4 || $line[3] === ' ') break; }
    return $data;
  };
  $step = function (?string $cmd, array $ok) use ($fp, $read): bool {
    if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
    $r = $read();
    $good = in_array((int)substr($r, 0, 3), $ok, true);
    if (!$good) error_log('contact.php smtp: ' . trim(strtok($r, "\n") ?: 'no reply'));
    return $good;
  };
  $ok = $step(null, [220])
     && $step('EHLO mediaexperts.ch', [250])
     && $step('AUTH LOGIN', [334])
     && $step(base64_encode($c['user']), [334])
     && $step(base64_encode($c['pass']), [235])
     && $step('MAIL FROM:<' . $c['user'] . '>', [250])
     && $step('RCPT TO:<' . $to . '>', [250, 251])
     && $step('DATA', [354]);
  if ($ok) {
    $msg = "To: <$to>\r\nSubject: $subject\r\nDate: " . date('r') . "\r\n"
         . 'Message-ID: <' . bin2hex(random_bytes(12)) . "@mediaexperts.ch>\r\n"
         . $headers . "\r\n\r\n" . $body;
    $msg = str_replace("\n", "\r\n", str_replace(["\r\n", "\r"], "\n", $msg));
    $msg = preg_replace('/^\./m', '..', $msg);              // SMTP dot-stuffing
    fwrite($fp, $msg . "\r\n.\r\n");
    $ok = $step(null, [250]);
  }
  @fwrite($fp, "QUIT\r\n");
  fclose($fp);
  return $ok;
}

$cfgFile = __DIR__ . '/contact-config.php';
$cfg = null;
if (is_file($cfgFile)) {
  try { $cfg = include $cfgFile; }
  catch (\Throwable $e) { error_log('contact.php: contact-config.php is not valid PHP: ' . $e->getMessage()); $cfg = null; }
}
$smtp = is_array($cfg) && !empty($cfg['user']) && !empty($cfg['pass']);
$from = $smtp ? $cfg['user'] : TO;   // Infomaniak requires the sender to be the login's own address

function send_mail(string $to, string $subject, string $headers, string $body): bool {
  global $smtp, $cfg, $from;
  if ($smtp) return smtp_send($cfg + ['host' => 'mail.infomaniak.com', 'port' => 465], $to, $subject, $headers, $body);
  return mail($to, $subject, $body, $headers, '-f' . $from);
}

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
  'From: ' . hdr(FROM_NAME . ' Website') . ' <' . $from . '>',
  'Reply-To: ' . hdr($name) . ' <' . $email . '>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: base64',
]);
if (!send_mail(TO, hdr("Website: $topic — $name"), $headers, chunk_split(base64_encode($body)))) out(502, ['ok' => false, 'error' => 'send']);

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
    'From: ' . hdr(FROM_NAME) . ' <' . $from . '>',
    'Reply-To: ' . TO,
    'Auto-Submitted: auto-replied',
    'MIME-Version: 1.0',
    "Content-Type: multipart/alternative; boundary=\"$b\"",
  ]);
  send_mail($email, hdr($subject), $h2, $mime);
}

out(200, ['ok' => true]);
