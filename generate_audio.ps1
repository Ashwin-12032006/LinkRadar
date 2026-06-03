Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("d:\Katomarans\test_speech.wav")
$synth.Speak("Hello, this is a test of the speech synthesis engine on Windows.")
$synth.Dispose()
Write-Output "Done generating test_speech.wav"
