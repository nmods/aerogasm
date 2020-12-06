# Aerogasm
Aero changing module for Tera toolbox.  
Randomly changing skybox/lighting/effects, giving TERA a more dynamic feel.

Video:  
[![Aerogasm video](https://img.youtube.com/vi/nl5hLvhxXf8/0.jpg)](https://www.youtube.com/watch?v=nl5hLvhxXf8)

### Partial list of effects:
- Skybox
- Weather
    - Rain
    - Snow
    - Clouds
    - Lightning
- Lighting
    - Color
    - Brightness
- Fog
- Underwater
- Any combination of above

## Configuration
<details>
<summary>
<b>Commands</b>
</summary>

All commands go in toolbox channel `/8` and start with `aero`

`on` - enable  
`off` - disable  
`stop/pause/s` - stop without reverting to normal  
`next/n` - next aero  
`reset` - revert to normal and next aero  
`time <time in ms>` - time between aeros (default: 90000, fast: 2000)  
`blend <time>` - blending time between aeros (default: 8, fast: 1)  
`current/info/i` - print settings and current aero's name  

`set <aero name>` - set aero to `<aero name>`  
&emsp;- list of aeros in aeros.json

`mode/m <mode>` - change mode  
&emsp;- modes: random/manual/preset  
&emsp;&emsp;- `random`/`r`/`n`: random aeros  
&emsp;&emsp;- `manual`/`m`: set aeros manually with aero set  
&emsp;&emsp;- `preset`/`p`: shuffle through select (or all) aeros with their own settings  

`preset/p <preset>` - set preset to `<preset>`  
&emsp;- `list` to list all presets  
&emsp;- default presets:  
&emsp;&emsp;- `classic`: classic day/night cycle  
&emsp;&emsp;- `normal`: normal random aeros  
&emsp;&emsp;- `fast`: fast random  
&emsp;&emsp;- `faster`: faster  
&emsp;&emsp;- `super`: super fast  
&emsp;&emsp;- `hyper`: unstable fast  
&emsp;&emsp;- `order`: all aeros in order  
&emsp;&emsp;- `dynamicdaysaltyweather`: [dynamic-day](https://github.com/SaltyMonkey/dynamic-day) by saltymonkey (weather version)  
&emsp;&emsp;- `dynamicdaysalty`: [dynamic-day](https://github.com/SaltyMonkey/dynamic-day) by saltymonkey  
&emsp;&emsp;- `dynamicday`: edited version of above  

`dungeon` - toggle dungeon mode on/off  
`dungeon bl` - enable dungeon blacklist  

`blacklist/bl <operation> <aero>` - modify dungeon blacklist  
&emsp;operations: add/remove/clear  
&emsp;&emsp;- `add`: add current aero to blacklist  
&emsp;&emsp;- `add <aero>`: add `<aero>` to blacklist  
&emsp;&emsp;- `remove`: remove last added aero from blacklist  
&emsp;&emsp;- `remove <aero>`: remove `<aero>` from blacklist  
&emsp;&emsp;- `clear`: clear blacklist  
&emsp;&emsp;- (nothing): print current blacklist  

#### Examples:
- `/8 aero preset faster` - set preset to "faster"
- `/8 aero m r` - set mode to random
- `/8 aero time 10000` - aero interval to 10 sec
- `/8 aero blend 1` - aeros blend really fast
- `/8 aero n` - next aero
- `/8 aero dungeon bl` - enable dungeon blacklist
- `/8 aero bl add Kubel_Fortress_Pegasus_AERO.AERO.Kubel_Fortress_Pegasus_AERO` - add that VERY thick fog to dungeon blacklist
- `/8 aero bl` - print current blacklist
</details>

<details>
<summary>
<b>Preset format</b>
</summary>

<table>
<tr>
<th> Format </th>
<th> Description </th>
</tr>
<tr>
<td>

```json
"name": {
        "random": false,
        "aeros": [
            "aero1",
            "aero2",
            "aero3",
        ],
        "cycleTime": 12345,
        "blendTime": 1.5,
        "description": "blah",
        "printName":true,
        "hideComments":true
    },
```

</td>
<td>

```json
name of preset
random/in order
array of aeros or 'all' for all aeros
see aeros.json for names of all aeros



(optional) time between aeros in milliseconds
(optional) transition value, can be decimal
(optional) description for the preset
(optional) print the name of aeros
(optional) hide comments of aeros


```

</td>
</tr>
</table>

</details>

## Changelog
<details>

#### 1.1 (current)
- load aeros from datacenter using toolbox
- add presets for [dynamic-day](https://github.com/SaltyMonkey/dynamic-day)
- some fixes
#### 1.0
- released
</details>

---
Original idea from [codeagon's cycles](https://github.com/codeagon/cycles)
