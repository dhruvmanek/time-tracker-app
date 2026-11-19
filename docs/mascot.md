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

## Still needed

**Core**

| File | Pose prompt | Used for |
|---|---|---|
| `happy.png` | standing relaxed, arms down, gentle smile | Home on a normal day |

**Onboarding and rewards**

| File | Pose prompt | Used for |
|---|---|---|
| `think.png` | thinking, one hand on its chin, eyes looking up | Quiz questions |
| `watch.png` | looking at the wristwatch on its arm, pointing at it | "How many hours do you lose?" |
| `shocked.png` | shocked, both hands on its cheeks, mouth open | "Years of your life" and time sinks |
| `dreamy.png` | dreamy and hopeful, hands clasped, hearts in its eyes | "What would you do with the time?" |
| `ring.png` | bells ringing loudly with little motion lines, happy | Choosing check-in hours |
| `notify.png` | holding a phone up, showing a notification on the screen | "Logging takes 2 seconds" |
| `windup.png` | a big golden wind-up key on its back, determined face | Hold to wind up Tikko |
| `party.png` | celebrating with confetti and a party hat | Turning on notifications |
| `crown.png` | proudly wearing a small gold crown | Level up |

**Activities** (Tikko does what you just logged)

| File | Pose prompt | Activity |
|---|---|---|
| `laptop.png` | typing on a small laptop, focused | Deep work |
| `book.png` | reading an open book, curious | Learning |
| `dumbbell.png` | lifting a dumbbell, sweating, determined | Exercise |
| `lotus.png` | meditating cross-legged, eyes closed, calm | Meditation & self-care |
| `basket.png` | carrying a laundry basket | Chores & errands |
| `heart.png` | hugging a big red heart | Friends & family |
| `clipboard.png` | holding a clipboard with a checklist and a pencil | Meetings & admin |

## Originality

Tikko must stay clearly its own character. Use only Tikko's own image as the
reference, never another app's mascot. Write all onboarding text and pose ideas
in Tikko's own voice.
