#!/usr/bin/env node
const request = require('request');
const ru_syntax = require("./dict-ru/syn.json");
const ru_answer = require("./dict-ru/answ.json");
const fuzzysort = require("fuzzysort");
var prepared_syn = [];
var isRude{};
function ru_initialize(){
    for(var i = ru_syntax.length-1; i>=0; i-=1) {
        prepared_syn[i] = [fuzzysort.prepare(ru_syntax[i][0])];
        for(var ii = 1; ii<ru_syntax[i].length; ii++){
            prepared_syn[i].push(fuzzysort.prepare(ru_syntax[i][ii]));
        }
    }
}
function ru_proceed(a,b,c){
    var answer = "";
    var module_answ = "happy";
    if(isRude[c] != undefined && isRude[c]){module_answ="angry";}
    for(var ii = 0;ii<ru_syntax.length-1;ii++){
        try{
            var foundarr = fuzzysort.go(a, prepared_syn[ii]).filter(function(item){return item.score<4;});
            for (var i = 0; i < foundarr.length; i++) {
                if(ru_syntax[ii][0]=="rude"){isRude[c] = true; module_answ = "angry";}
                var answtype = ru_answer[module_answ][ru_syntax[ii][0]];
                answer += answtype[Math.floor(Math.random()*answtype.length)]+ru_answer[module_answ][hello2][Math.floor(Math.random()*5)];
            }
        }
        catch(e){
            console.log(e);
        }
    }
    if(answer == "" && b){
        answer = ru_answer[module_answ]["unknown"][Math.floor(Math.random()*ru_answer[module_answ]["unknown"].length)]
    }
    return answer;
}
const Discord = require("discord.js");
var search = require('youtube-search');
var opts = {
    maxResults: 15,
    key: 'AIzaSyDvqRvfMnpyw_ebX-iP511iyxKnjktdsSo'
};
const client = new Discord.Client();
const yt = require('ytdl-core');
let queue = {};
let searches = {};
let mesarr = {};
const commands = {
    'clear':(msg) =>{
        if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`РћС‡РµСЂРµРґСЊ СѓР¶Рµ РѕС‡РёС‰РµРЅР°.`);
        queue[msg.guild.id] = {};
        queue[msg.guild.id].playing = false;
        queue[msg.guild.id].songs = [];
        msg.reply("РћС‡РёС‰РµРЅРѕ СѓСЃРїРµС€РЅРѕ");
    },
    'play': (msg) => {
        if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Р”РѕР±Р°РІСЊС‚Рµ РїРµСЃРЅСЋ РёСЃРїРѕР»СЊР·СѓСЏ: &add`);
        if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
        if (queue[msg.guild.id].playing) return msg.channel.sendMessage('РЈР¶Рµ РёРіСЂР°РµС‚');
        let dispatcher;
        queue[msg.guild.id].playing = true;

        console.log(queue);
        (function play(song) {
            console.log(song);
            if (song === undefined) return msg.channel.sendMessage('РћС‡РµСЂРµРґСЊ РїСѓСЃС‚Р°СЏ').then(() => {
                queue[msg.guild.id].playing = false;
                msg.member.voiceChannel.leave();
            });
            msg.channel.sendMessage(`РРіСЂР°СЋ: **${song.title}** РІРєР»СЋС‡РµРЅРЅСѓСЋ: **${song.requester}**`);
            dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : tokens.passes });
            let collector = msg.channel.createCollector(m => m);
            collector.on('message', m => {
                if (m.content.startsWith(tokens.prefix + 'pause')) {
                    msg.channel.sendMessage('РџРѕСЃС‚Р°РІР»РµРЅРЅРѕ РЅР° РїР°СѓР·Сѓ').then(() => {dispatcher.pause();});
                } else if (m.content.startsWith(tokens.prefix + 'resume')){
                    msg.channel.sendMessage('РЎРЅСЏС‚Рѕ СЃ РїР°СѓР·С‹').then(() => {dispatcher.resume();});
                } else if (m.content.startsWith(tokens.prefix + 'skip')){
                    msg.channel.sendMessage('РџСЂРѕРїСѓС‰РµРЅРЅРѕ').then(() => {dispatcher.end();});
                } else if (m.content.startsWith('volume+')){
                    if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendMessage(`Р“СЂРѕРјРєРѕСЃС‚СЊ: ${Math.round(dispatcher.volume*50)}%`);
                    dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
                    msg.channel.sendMessage(`Р“СЂРѕРјРєРѕСЃС‚СЊ: ${Math.round(dispatcher.volume*50)}%`);
                } else if (m.content.startsWith('volume-')){
                    if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendMessage(`Р“СЂРѕРјРєРѕСЃС‚СЊ: ${Math.round(dispatcher.volume*50)}%`);
                    dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
                    msg.channel.sendMessage(`Р“СЂРѕРјРєРѕСЃС‚СЊ: ${Math.round(dispatcher.volume*50)}%`);
                } else if (m.content.startsWith(tokens.prefix + 'time')){
                    msg.channel.sendMessage(`Р’СЂРµРјСЏ: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
                }
            });
            dispatcher.on('end', () => {
                collector.stop();
                play(queue[msg.guild.id].songs.shift());
            });
            dispatcher.on('error', (err) => {
                return msg.channel.sendMessage('error: ' + err).then(() => {
                    collector.stop();
                    play(queue[msg.guild.id].songs.shift());
                });
            });
        })(queue[msg.guild.id].songs.shift());
    },
    'join': (msg) => {
        return new Promise((resolve, reject) => {
            const voiceChannel = msg.member.voiceChannel;
            if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('РќРµРІРѕР·РјРѕР¶РЅРѕ РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє РєР°РЅР°Р»Сѓ... Р’РѕР№РґРёС‚Рµ, РµСЃР»Рё РІС‹ СЌС‚Рѕ РЅРµ СЃРґРµР»Р°Р»Рё!');
            voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
        });
    },
    'leave': (msg) => {
        return new Promise((resolve, reject) => {
            const voiceChannel = msg.member.voiceChannel;
            if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('РќРµРІРѕР·РјРѕР¶РЅРѕ РІС‹Р№С‚Рё РёР· РєР°РЅР°Р»Р°... Р’РѕР№РґРёС‚Рµ, РµСЃР»Рё РІС‹ СЌС‚Рѕ РЅРµ СЃРґРµР»Р°Р»Рё!');
            voiceChannel.leave();
        });
    },
    'add': (msg) => {
        let url = msg.content.split(' ')[1];
        if (url == '' || url === undefined) return msg.channel.sendMessage(`РћС‚РїСЂР°РІСЊС‚Рµ СЃСЃС‹Р»РєСѓ РЅР° РІРёРґРµРѕ РёР· YouTube, РёР»Рё РµРіРѕ РїР°СЂР°РјРµС‚СЂ v, РёСЃРїРѕР»СЊР·СѓСЏ &add`);
        yt.getInfo(url, (err, info) => {
            if(err) return msg.channel.sendMessage('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РІРёРґРµРѕ: ' + err);
            if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
            queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
            console.dir(queue[msg.guild.id].songs);
            msg.channel.sendMessage(`Р”РѕР±Р°РІР»РµРЅР° РјСѓР·С‹РєР° **${info.title}** РІ РѕС‡РµСЂРµРґСЊ`);
        });
    },
    'queue': (msg) => {
        if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Р”РѕР±Р°РІСЊС‚Рµ РїРµСЃРЅСЋ РІ РѕС‡РµСЂРµРґСЊ С‡РµСЂРµР· &add`);
        let tosend = [];
        queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Р—Р°РїСѓС‰РµРЅРѕ: ${song.requester}`);});
        msg.channel.sendMessage(`__**РћС‡РµСЂРµРґСЊ РєР°РЅР°Р»Р° ${msg.guild.name}:**__ РРіСЂР°РµС‚ СЃРµР№С‡Р°СЃ **${tosend.length}** РџРµСЃРµРЅ РІ РѕС‡РµСЂРµРґРё ${(tosend.length > 15 ? '*[РџРѕРєР°Р·Р°РЅРѕ С‚РѕР»СЊРєРѕ 15]*' : '')}\r\n\`\`\`${tosend.slice(0,15).join('\r\n')}\`\`\``);
    },
    'search': (msg) =>{
        searches[msg.guild.id] = ['NoVideoInNull'];
        let tos = "";
        msg.content.split(' ').forEach(function(item, i, arr){
            if(i>=1)tos+=item+" ";
        });
        let msgt = "Р’С‹Р±РµСЂРёС‚Рµ РІРёРґРµРѕ РґР»СЏ РѕС‚РїСЂР°РІРєРё С‡РµСЂРµР· &choose [РЅРѕРјРµСЂ]";
        search(tos, opts, function(err, results) {
            if(err) return msg.reply("Error: "+err);
            let id = 0;
            results.forEach(function(item, i, arr){
                if(item.kind == 'youtube#video'){
                    id++;
                    msgt += "\r\n"+id+". **"+item.title+"** РѕС‚ **"+item.channelTitle+"**";
                    searches[msg.guild.id].push(item.id);
                }
            });
            console.log(msgt);
            msg.reply(msgt);
        });
    },
    'choose': (msg) => {
        let id = parseInt(msg.content.split(' ')[1], 10);
        if (id == '' || id === undefined || id == 'NaN') return msg.channel.sendMessage(`Р’РІРµРґРёС‚Рµ РІРµСЂРЅС‹Р№ РЅРѕРјРµСЂ`);
        let idv = "";
        if(searches[msg.guild.id] === undefined) return msg.reply("РЎРЅР°С‡Р°Р»Р° РЅСѓР¶РµРЅ РїРѕРёСЃРє РєРѕРјР°РЅРґРѕР№ &search");
        searches[msg.guild.id].forEach(function(item, i, arr){
            if(i == id)idv = item;
        });
        yt.getInfo(idv, (err, info) => {
            if(err) return msg.channel.sendMessage('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РІРёРґРµРѕ: ' + err);
            if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
            queue[msg.guild.id].songs.push({url: idv, title: info.title, requester: msg.author.username});
            msg.channel.sendMessage(`Р”РѕР±Р°РІР»РµРЅР° РјСѓР·С‹РєР° **${info.title}** РІ РѕС‡РµСЂРµРґСЊ`);
        });
        searches[msg.guild.id] = [];
    },
    'helpmusic': (msg) => {
        let tosend = ['```', tokens.prefix + 'join - РџСЂРёСЃРѕРµРґРёРЅРёС‚СЊСЃСЏ Рє РєР°РЅР°Р»Сѓ РѕС‚РїСЂР°РІРёС‚РµР»СЏ',	tokens.prefix + 'add - Р”РѕР±Р°РІРёС‚СЊ РјСѓР·С‹РєСѓ РёР· СЃСЃС‹Р»РєРё YouTube', tokens.prefix + 'search - РџРѕРёСЃРє + РґРѕР±Р°РІР»РµРЅРёРµ РІ РѕС‡РµСЂРµРґСЊ РёР· YouTube', tokens.prefix + 'queue - РџРѕРєР°Р·С‹РІР°РµС‚ РѕС‡РµСЂРµРґСЊ РґРѕ 15РѕР№ РїРµСЃРЅРё', tokens.prefix + 'play - РРіСЂР°РµС‚ РѕС‡РµСЂРµРґСЊ', tokens.prefix + 'leave - РџРѕРєРёРЅСѓС‚СЊ С‡Р°С‚.', tokens.prefix + 'clear - РћС‡РёСЃС‚РёС‚СЊ РѕС‡РµСЂРµРґСЊ.', '', 'РљРѕРјР°РЅРґС‹ СѓРїСЂР°РІР»РµРЅРёСЏ РјСѓР·С‹РєРѕР№-'.toUpperCase(), tokens.prefix + 'pause - РџРѕСЃС‚Р°РІРёС‚СЊ РЅР° РїР°СѓР·Сѓ',	tokens.prefix + 'resume - РЎРЅСЏС‚СЊ СЃ РїР°СѓР·С‹', tokens.prefix + 'skip - РїСЂРѕРїСѓСЃС‚РёС‚СЊ РїРµСЃРЅСЋ', tokens.prefix + 'time - РџРѕРєР°Р·С‹РІР°РµС‚ РІСЂРµРјСЏ РїРµСЃРЅРё.',	'volume+(+++) - РџРѕРІС‹С€Р°РµС‚ РіСЂРѕРјРєРѕСЃС‚СЊ РЅР° 2%/+',	'volume-(---) - РЈРјРµРЅСЊС€Р°РµС‚ РіСЂРѕРјРєРѕСЃС‚СЊ РЅР° 2%/-',	'```'];
        msg.channel.sendMessage(tosend.join('\r\n '));
    }
};
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
client.on('guildMemberAdd', member => {
    try{
        channel = member.guild.channels.get("472332726998007809");
        channel.send(`РџСЂРёРІРµС‚СЃС‚РІСѓРµРј РЅР° РЅР°С€РµРј СЃРµСЂРІР°РєРµ РїРѕ РјР°Р№РЅРєСЂР°С„С‚Сѓ, ${member}`);
        //member.addRole('495675485716742155');
    }
    catch(error){console.log(`РћС€РёР±РєР° API: ${error}`);}
});
client.on("ready", () => {
    ru_initialize();
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setActivity(`&help`, {type : "WATCHING"});
});


client.on("message", async message => {
    if(message.author.bot) return;
    if (!mesarr.hasOwnProperty(message.channel.id)) mesarr[message.channel.id] = 0;
    mesarr[message.channel.id]++;
    if(message.content.toLowerCase().indexOf(&) !== 0){
        if(mesarr[message.channel.id] >=5 || message.channel.name == 'РѕР±С‰Р°Р»РєРё-СЃ-Р±РѕС‚РѕРј') {
            mesarr[message.channel.id] = 0;
            let cccc = ru_proceed(message.content,message.channel.name == 'РѕР±С‰Р°Р»РєРё-СЃ-Р±РѕС‚РѕРј',message.author);
            if(cccc !=""){
                message.reply(cccc);}
        });
}
return;
}
const args = message.content.slice(1).trim().split(/ +/g);
const command = args.shift().toLowerCase();
//discord music
if (commands.hasOwnProperty(message.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[message.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](message);
if(command === "testnewuser"){
    channel = message.member.guild.channels.find(ch => ch.name === "С‡Р°С‚РёРє");
    try{
        channel.send(`РџСЂРёРІРµС‚СЃС‚РІСѓРµРј РЅР° ${message.guild.name}, ${message.member}`)}
    catch(error){message.reply(`РћС€РёР±РєР° API: ${error}`);}
}
if(command === "complaint"){
    channel = message.member.guild.channels.find(ch => ch.name === "complaint");
    var prichina = "";
    args.forEach(function(item, i, arr){
        if(i>=1){
            prichina+=item+" ";
        }
    });
    channel.send(`Р–Р°Р»РѕР±Р° РѕС‚ ${message.author} РЅР° ${args[0]}, РїРѕ РїСЂРёС‡РёРЅРµ: \`\`\`${prichina}\`\`\``);
}
if(command === "help"){
    message.channel.send("```РљРѕРјР°РЅРґС‹: \r\n \r\n &ping - РїСЂРѕРІРµСЂРёС‚СЊ ping \r\n &purge [С‡РёСЃР»Рѕ] - РѕС‡РёСЃС‚РєР° РґР°РЅРЅРѕРіРѕ РєРѕР»РёС‡РµСЃС‚РІР° СЃРѕРѕР±С‰РµРЅРёР№ \r\n &complaint [РЅР° РєРѕРіРѕ] [С‚РµРєСЃС‚ Р¶Р°Р»РѕР±С‹] - РїРѕР¶Р°Р»РѕРІР°С‚СЊСЃСЏ РЅР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ \r\n &helpmusic - РїРѕРјРѕС‰СЊ СЃ РјСѓР·С‹РєР°Р»СЊРЅС‹Рј Р±РѕС‚РѕРј```");
}
if(command === "ping") {
    const m = await message.channel.send("РџСЂРѕРІРµСЂРєР° ping....");
    m.edit(`РџСЂРѕРІРµСЂРµРЅРѕ! РџРёРЅРі: ${m.createdTimestamp - message.createdTimestamp}РјСЃ. Р—Р°РґРµСЂР¶РєР° РІ API(client ping): ${Math.round(client.ping)}РјСЃ`);
}
if(command === "purge") {
    if(message.member.roles.some(r=>["DEV", "STAFF"].includes(r.name)) ){

        const deleteCount = parseInt(args[0], 10);
        if(!deleteCount || deleteCount < 2 || deleteCount > 100)
            return message.reply("Р’РІРµРґРёС‚Рµ С‡РёСЃР»Рѕ РѕС‚ 2 РґРѕ 100");
        const fetched = await message.channel.fetchMessages({limit: deleteCount});
        message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`РћС€РёР±РєР° API: ${error}`));}
    else message.reply("РЈ С‚РµР±СЏ РЅРµ РїСЂРёРІРёР»РµРіРёР№ РЅР° СѓРґР°Р»РµРЅРёРµ");
}
});
client.login(config.token);