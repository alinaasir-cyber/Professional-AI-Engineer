import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "multi_voice_chat");

const powershellScript = String.raw`
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$turnsJson = [System.Text.Encoding]::UTF8.GetString(
  [System.Convert]::FromBase64String($env:TTS_DIALOGUE_B64)
)
$turns = $turnsJson | ConvertFrom-Json
$outputDir = $env:TTS_OUTPUT_DIR
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$voiceEnumerator = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $installedVoices = @(
    $voiceEnumerator.GetInstalledVoices() |
      Where-Object { $_.Enabled } |
      ForEach-Object { $_.VoiceInfo }
  )
} finally {
  $voiceEnumerator.Dispose()
}
if ($installedVoices.Count -eq 0) {
  throw "No Windows speech voices are installed. Install a voice in Windows Settings and try again."
}

$maleVoice = $installedVoices | Where-Object { $_.Gender.ToString() -eq "Male" } | Select-Object -First 1
$femaleVoice = $installedVoices | Where-Object { $_.Gender.ToString() -eq "Female" } | Select-Object -First 1
if (-not $maleVoice) { $maleVoice = $installedVoices[0] }
if (-not $femaleVoice) { $femaleVoice = $installedVoices[0] }

foreach ($turn in $turns) {
  $voice = if ($turn.voice -eq "male") { $maleVoice } else { $femaleVoice }
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $synth.SelectVoice($voice.Name)
    $synth.SetOutputToWaveFile((Join-Path $outputDir "$($turn.id).wav"))
    $synth.Speak("$($turn.name). $($turn.text)")
  } finally {
    $synth.Dispose()
  }
}

$includeFullConversation = $env:TTS_FULL_CONVERSATION -eq "true"
if ($includeFullConversation) {
  $combined = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $combined.SetOutputToWaveFile((Join-Path $outputDir "full_conversation.wav"))
    foreach ($turn in $turns) {
      $voice = if ($turn.voice -eq "male") { $maleVoice } else { $femaleVoice }
      $combined.SelectVoice($voice.Name)
      $combined.Speak("$($turn.name). $($turn.text)")
    }
  } finally {
    $combined.Dispose()
  }
}

Write-Output "Offline voice used: $($maleVoice.Name) / $($femaleVoice.Name)"
Write-Output "Audio file saved to: $outputDir"
`;

export function generateSpeech(turns, { includeFullConversation = false } = {}) {
  if (turns.length === 0) {
    throw new Error("Provide at least one speaker to generate.");
  }

  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", powershellScript],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        TTS_DIALOGUE_B64: Buffer.from(JSON.stringify(turns), "utf8").toString("base64"),
        TTS_OUTPUT_DIR: outputDir,
        TTS_FULL_CONVERSATION: String(includeFullConversation),
      },
    },
  );

  if (result.error) {
    throw new Error(`Could not start Windows offline speech synthesis: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Speech synthesis exited with code ${result.status}.`);
  }

  console.log(result.stdout.trim());
}
