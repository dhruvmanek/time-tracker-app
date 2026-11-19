# Tikko mascot: pose list

Tikko's poses are transparent PNGs in `assets/mascot/`, all cut from the same frame
so the character never jumps when the pose changes. The app already knows where each
pose goes. Until a pose exists, it falls back to the closest mood.

## How to make a pose

In Flow, upload `wave.png`'s original (the waving image) as the reference and use:

> Same exact character as the reference image: same teal clock rim, peach bells and
> back, same face style, same proportions, same outline thickness, same size and
> position in the frame. Full body, centered, facing the viewer at the same angle.
> Plain white background, no text, no sparkles, no shadow, no watermark.
> 16:9 image, 1376×768. Pose: **[pose]**

Keep the character the same size and in the same spot as the reference, so the poses
line up. Reject any image where the rim colour, bells or face style drift.

Send the images in chat. They get cut out and added to the app.

## Done

| File | Pose |
|---|---|
| `wave.png` | waving hello |
| `cheer.png` | both fists up, cheering |
| `tired.png` | tired, dark circles, slouching |
| `drained.png` | exhausted, sweating, drooping |
| `sleep.png` | asleep in a striped nightcap, zzz |
| `gamepad.png` | holding a game controller (TV & games) |
| `swirl.png` | dizzy on a couch (Procrastinating). Wider than Tikko, so it's registered with `wide` |
| `mug.png` | drinking coffee (Meals & rest) |
| `wheel.png` | driving a little car (Commute) |
| `phone.png` | glazed eyes, scrolling a phone (Social media) |
| `clipboard.png` | clipboard and pencil (Meetings & admin) |
| `heart.png` | hugging a heart (Friends & family) |
| `basket.png` | laundry basket (Chores & errands) |
| `lotus.png` | meditating (Meditation & self-care) |
| `dumbbell.png` | lifting, sweating (Exercise) |
| `book.png` | reading (Learning) |
| `laptop.png` | typing (Deep work) |
| `crown.png` | crown, hands on hips (Level up) |
| `party.png` | party hat and confetti (Turning on check-ins) |
| `windup.png` | wind-up key, determined (Hold to wind up) |

More done: `happy`, `think`, `watch`, `shocked`, `dreamy`, `ring`, `notify`.

## Still needed

Nothing. The full set is complete (27 poses). New ideas can be added any time
using the prompt above.

## Originality

Tikko must stay clearly its own character. Use only Tikko's own image as the
reference, never another app's mascot. Write all onboarding text and pose ideas
in Tikko's own voice.
