const path = require('path');
const fs = require('fs');

module.exports = function Aerogasm(mod) {
	const command = mod.command || mod.require.command
	let aeroInterval = null,
		enabled = true,
		currentAero,
		currentPreset,
		count = 0,
		blendTime,
		cycleTime,
		printName,
		hideComments,
		aero = []

	let config = require('./config.json');
	let comments = require('./comments.json')
	let presets = require('./presets.json')

	mod.hook('C_LOAD_TOPO_FIN', 'event', () => {
		start(true)
	})

	if (mod.game.state == 2) {
		start(true)
	}

	function aeroSwitch(aero, forceBlendTime = -1) {
		//console.log(`aeroSwitch, forceblend: ${forceBlendTime}, aero: ${aero}`)
		let sendBlend = blendTime
		if (forceBlendTime >= 0) sendBlend = forceBlendTime
		mod.toClient('S_AERO', 1, {
			enabled: 1,
			blendTime: sendBlend,
			aeroSet: aero
		});
	}

	function timer(forceBlendTime = -1) {
		if (!enabled) return
		if (!config.dungeon && mod.game.me.inDungeon) return
		if (!['preset', 'manual'].includes(config.mode)) {
			currentAero = newRandomAero()
		} else if (config.mode == 'preset') {
			if (currentPreset.segments) {
				let hourNow = new Date().getHours()
				let currentSegment = null
				let lastSegment = currentPreset.segments[0]
				for (let seg of currentPreset.segments) {
					if (seg.startHour <= hourNow) currentSegment = seg
					if (seg.startHour>lastSegment.startHour) lastSegment = seg
				}
				if (currentSegment == null) currentSegment = lastSegment
				currentPreset.aeros = currentSegment.aeros
				//mod.log(`Hour: ${hourNow}, currentSegment: ${currentSegment.name}`)
			}

			if (currentPreset.random && currentPreset.aeros.length > 0) {
				if (currentPreset.aeros == 'all') currentAero = newRandomAero()
				else currentAero = random(currentPreset.aeros)
			} else {
				count++
				if (currentPreset.aeros == 'all') {
					if (count > aero.length) count = 0
					currentAero = aero[count]
				} else {
					if (count > currentPreset.aeros.length) count = 0
					currentAero = currentPreset.aeros[count]
				}
			}
		}
		if (printName) command.message(`Current aero is ${currentAero}`)
		if (config.mode != 'manual' && !hideComments) {
			command.message(`Aero comments: ${comments[currentAero].join(' - ')}`)
		}
		mod.setTimeout(aeroSwitch, 600, currentAero, forceBlendTime);
		//mod.setTimeout(aeroSwitch, 1000, currentAero, forceBlendTime);
	}

	function newRandomAero() {
		let newaero = random(aero)
		if (config.dungeon == 'bl' && mod.game.me.inDungeon) {
			let count = 0
			while (config.dungeonblacklist.includes(newaero)) {
				count++
				if (count > 100) break
				newaero = random(aero)
			}
		}
		return newaero
	}

	function random(min, max) {
		if (Array.isArray(min)) {
			return min[random(min.length)]
		}
		if (!max && min) {
			max = min
			min = 0
		}
		return Math.floor(Math.random() * (max - min) + min)
	}

	async function start(insta = false, presetMessage = false) {
		//console.log("start, insta: " + insta)
		if (aero.length == 0) aero = await loadAeros()
		mod.clearInterval(aeroInterval) 
		loadPreset(presetMessage)
		if (!config.dungeon && mod.game.me.inDungeon) return
		if(config.mode=="preset" && currentAero && insta && !currentPreset.changeEveryLoad) mod.setTimeout(aeroSwitch, 600, currentAero, 0);
		else timer(insta ? 0 : undefined)
		if (['random', 'preset'].includes(config.mode)) {
			aeroInterval = mod.setInterval(timer, cycleTime)
		}
	}

	function clearAero() {
		mod.toClient('S_START_ACTION_SCRIPT', 3, {
			gameId: mod.game.me.gameId,
			script: 105
		});
	}

	function loadPreset(message) {
		if (config.mode != 'preset') {
			blendTime = config.blendTime
			cycleTime = config.cycleTime
			printName = config.printName
			hideComments = config.hideComments
			return
		}
		//console.log(config.activePreset)
		currentPreset = presets[config.activePreset]
		//console.log(currentPreset)
		if (message && currentPreset.message) command.message(currentPreset.message)

		blendTime = currentPreset.blendTime ? currentPreset.blendTime : config.blendTime
		cycleTime = currentPreset.cycleTime ? currentPreset.cycleTime : config.cycleTime
		printName = currentPreset.printName ? currentPreset.printName : config.printName
		hideComments = currentPreset.hideComments ? currentPreset.hideComments : config.hideComments
	}

	command.add(['aero'], (...args) => {
		//args = args.map(x => typeof x == "string"?x.toLowerCase():x)
		args[0] = args[0].toLowerCase()
		switch (args[0]) {
			case "on":
				enabled = true;
				command.message('Activated.');
				start()
				break
			case "off":
				enabled = false;
				command.message('Deactivating and reverting');
				clearAero()
				mod.clearInterval(aeroInterval);
				break
			case "stop":
			case "pause":
			case "s":
				command.message('Paused. type "aero n" to continue');
				mod.clearInterval(aeroInterval);
				break
			case "next":
			case "n":
				start()
				break
			case "restart":
			case "reset":
				enabled = true;
				count = 0
				clearAero()
				start()
				break
			case "set":
				if (!args[1]) {
					command.message("Aero name required")
					return
				} else if (!aero.includes(args[1])) {
					command.message(`Aero ${args[1]} not found`)
					return
				}
				mod.clearInterval(aeroInterval)
				clearAero()
				config.mode = 'manual'
				currentAero = args[1]
				mod.setTimeout(aeroSwitch, 2000, currentAero);
				command.message(`Mode set to manual and aero set to ${currentAero}`)
				break
			case "timer":
			case "time":
				if (!args[1] || isNaN(args[1])) {
					command.message("Number required to set timer interval")
					return
				}
				mod.clearInterval(aeroInterval)
				config.cycleTime = Number(args[1])
				start()
				command.message(`Timer interval set to ${args[1]}ms`);
				break
			case "blendtime":
			case "blend":
				if (!args[1] || isNaN(args[1])) {
					command.message("Number required to set blending time")
					return
				}
				mod.clearInterval(aeroInterval)
				config.blendTime = Number(args[1])
				start()
				command.message(`Blending time step set to ${args[1]}ms`);
				break
			case "current":
			case "i":
			case "info":
				command.message(`mode: ${config.mode}${config.mode == 'preset' ? ` - ${config.activePreset}` : '.'}`)
				command.message(`cycleTime is ${cycleTime}`)
				command.message(`blendTime is ${blendTime}`)
				command.message(`Current aero is ${currentAero}`)
				mod.log(`Current aero is ${currentAero}`)
				command.message(`printName: ${printName}`)
				command.message(`hideComments: ${hideComments}`)
				if (Object.keys(comments).includes(currentAero)) {
					command.message(`Current aero comments: ${comments[currentAero].join(' - ')}`)
				} else {
					command.message('No comments on this aero. Use "aero c (text)" or "aero comment (text)" to add one.')
				}
				break
			case "c":
			case "comment":
				args.shift()
				args = args.join(' ')
				//console.log(args)
				if (!args || args.length == 0) {
					command.message('Comment required.')
					return
				}
				if (!comments[currentAero]) comments[currentAero] = []
				comments[currentAero].push(args)
				saveComments()
				command.message(`Added comment to ${currentAero}: "${args}"`)
				if (config.mode == 'comment') start()
				break
			case "mode":
			case "m":
				if (args[1]) args[1] = args[1].toLowerCase()
				switch (args[1]) {
					case 'random':
					case 'r':
					case 'normal':
					case 'n':
						if (config.mode == 'random') {
							command.message('Random mode is already on.')
							break
						}
						config.mode = 'random'
						command.message(`Random mode activated.`)
						start()

						break
					case 'preset':
					case 'p':
						if (config.mode == 'preset') {
							command.message('Preset mode is already on.')
							break
						}
						config.mode = 'preset'
						command.message(`Preset mode activated. Current preset: ${config.activePreset}`)
						if (currentPreset.message) command.message(currentPreset.message)
						start()

						break
					case 'manual':
					case 'm':
						if (config.mode == 'manual') {
							command.message('Manual mode is already on.')
							break
						}
						config.mode = 'manual'
						command.message(`Manual mode activated.`)
						command.message('Use "aero n" to go to next aero')
						mod.clearInterval(aeroInterval)
						break
					default:
						break
				}
				loadPreset()

				break
			case 'preset':
			case 'p':
				args[1] = typeof (args[1]) == "string" ? args[1].toLowerCase() : args[1]
				if (Object.keys(presets).includes(args[1])) {
					config.mode = 'preset'
					config.activePreset = args[1]
					command.message(`Preset changed to: ${config.activePreset}`)
					clearAero()
					start(false, true)
				} else if (args[1]) {
					if (args[1] == 'list') {
						command.message('List of presets:')
						for (let p in presets) {
							command.message(p + (presets[p].description ? (': ' + presets[p].description) : ''))
						}
						break
					}
					command.message(`Preset "${args[1]}" not found.`)
				} else {
					command.message(`Current preset: ${config.activePreset}`)
				}
				break
			case 'dungeon':
				if (typeof (args[1]) == "string" && args[1].toLowerCase() == 'bl') {
					config.dungeon = 'bl'
					command.message(`Dungeon blacklist enabled. Current blacklist:\n${config.dungeonblacklist.join('\n')}`)
				} else {
					config.dungeon = !config.dungeon
					command.message(`${config.dungeon ? 'En' : 'Dis'}abled in dungeons`)
				}
				break
			case 'blacklist':
			case 'bl':
				args[1] = typeof (args[1]) == "string" ? args[1].toLowerCase() : args[1]
				switch (args[1]) {
					case 'add':
						if (!args[2]) {
							if (config.dungeonblacklist.includes(currentAero)) {
								command.message(`${currentAero} already in blacklist`)
								return
							}
							config.dungeonblacklist.push(currentAero)
							command.message(`Added ${currentAero} to blacklist`)
							if (config.dungeon == 'bl' && mod.game.me.inDungeon) start()
						} else {
							config.dungeonblacklist.push(args[2])
							command.message(`Added ${args[2]} to blacklist`)
						}
						break
					case 'remove':
						if (!args[2]) {
							let removed = config.dungeonblacklist.pop()
							command.message(`Removed ${removed} from blacklist`)
						} else {
							if (config.dungeonblacklist.includes(args[2])) {
								command.message(`${args[2]} not in blacklist`)
								return
							}
							config.dungeonblacklist = config.dungeonblacklist.filter(x => x != args[2])
							command.message(`removed ${args[2]} from blacklist`)
						}
						break
					case 'clear':
						config.dungeonblacklist = []
						command.message(`Blacklist cleared`)
						break
					default:
						if (config.dungeonblacklist.length == 0) {
							command.message(`Current blacklist is empty`)
						} else {
							command.message(`Current blacklist:\n${config.dungeonblacklist.join('\n')}`)
						}
						break
				}
				break
			case 'test':
				loadAeros()
				console.log("aero length: " + aero.length)
				// mod.queryData('/ResourceSummary/Package/AeroSet',[],true,false,['name']).then(result => {
				// 	let aerolist = []
				// 	for(let obj of result){
				// 		aerolist.push(obj.attributes.name)
				// 	}
				// 	console.log(aerolist)
				// })
				break
			default:
				command.message(`Invalid command: ${args.join(' ')}`)
				return
		}
		saveConfig()
	});

	async function loadAeros() {
		let aerolist = []
		let result = await mod.queryData('/ResourceSummary/Package/AeroSet', [], true, false, ['name'])
		for (let obj of result) {
			aerolist.push(obj.attributes.name)
		}
		return aerolist
	}

	function saveConfig() {
		fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, '\t'), err => { });
	}
	function saveComments() {
		fs.writeFile(path.join(__dirname, 'comments.json'), JSON.stringify(comments, null, '\t'), err => { });
	}

	this.destructor = () => {
		command.remove(['aero'])
		mod.clearInterval(aeroInterval)
	};
};
