#!/usr/bin/env node
const request = require('request');
const ru_syntax = require("./dict-ru/syn.json");
const ru_answer = require("./dict-ru/answ.json");
const fuzzysort = require("fuzzysort");
var prepared_syn = [];
let isRude ={};

function ru_initialize() {
    for (var i = ru_syntax.length - 1; i >= 0; i -= 1) {
        prepared_syn[i] = [fuzzysort.prepare(ru_syntax[i][0])];
        for (var ii = 1; ii < ru_syntax[i].length; ii++) {
            prepared_syn[i].push(fuzzysort.prepare(ru_syntax[i][ii]));
        }
    }
}

function ru_proceed(a, b, c) {
    var answer = "";
    var module_answ = "happy";
    if (isRude[c] != undefined && isRude[c]) {
        module_answ = "angry";
    }
    for (var ii = 0; ii < ru_syntax.length - 1; ii++) {
        try {
            var foundarr = fuzzysort.go(a, prepared_syn[ii]).filter(function (item) {
                return item.score < 4;
            });
            for (var i = 0; i < foundarr.length; i++) {
                if (ru_syntax[ii][0] == "rude") {
                    isRude[c] = true;
                    module_answ = "angry";
                }
                var answtype = ru_answer[module_answ][ru_syntax[ii][0]];
                answer += answtype[Math.floor(Math.random() * answtype.length)] + ru_answer[module_answ][hello2][Math.floor(Math.random() * 5)];
            }
        } catch (e) {
            console.log(e);
        }
    }
    if (answer == "" && b) {
        answer = ru_answer[module_answ]["unknown"][Math.floor(Math.random() * ru_answer[module_answ]["unknown"].length)]
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
    'clear': (msg) => {
        if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Очередь уже очищена.`);
        queue[msg.guild.id] = {};
        queue[msg.guild.id].playing = false;
        queue[msg.guild.id].songs = [];
        msg.reply("Очищено успешно");
    },
    'play': (msg) => {
        if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Добавьте песню используя: &add`);
        if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
        if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Уже играет');
        let dispatcher;
        queue[msg.guild.id].playing = true;

        console.log(queue);
        (function play(song) {
            console.log(song);
            if (song === undefined) return msg.channel.sendMessage('Очередь пустая').then(() => {
                queue[msg.guild.id].playing = false;
                msg.member.voiceChannel.leave();
            });
            msg.channel.sendMessage(`�граю: **${song.title}** включенную: **${song.requester}**`);
            dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, {audioonly: true}), {passes: 1});
            let collector = msg.channel.createCollector(m => m);
            collector.on('message', m => {
                if (m.content.startsWith('&pause')) {
                    msg.channel.sendMessage('Поставленно на паузу').then(() => {
                        dispatcher.pause();
                    });
                } else if (m.content.startsWith('&resume')) {
                    msg.channel.sendMessage('Снято с паузы').then(() => {
                        dispatcher.resume();
                    });
                } else if (m.content.startsWith('&skip')) {
                    msg.channel.sendMessage('Пропущенно').then(() => {
                        dispatcher.end();
                    });
                } else if (m.content.startsWith('volume+')) {
                    if (Math.round(dispatcher.volume * 50) >= 100) return msg.channel.sendMessage(`Громкость: ${Math.round(dispatcher.volume * 50)}%`);
                    dispatcher.setVolume(Math.min((dispatcher.volume * 50 + (2 * (m.content.split('+').length - 1))) / 50, 2));
                    msg.channel.sendMessage(`Громкость: ${Math.round(dispatcher.volume * 50)}%`);
                } else if (m.content.startsWith('volume-')) {
                    if (Math.round(dispatcher.volume * 50) <= 0) return msg.channel.sendMessage(`Громкость: ${Math.round(dispatcher.volume * 50)}%`);
                    dispatcher.setVolume(Math.max((dispatcher.volume * 50 - (2 * (m.content.split('-').length - 1))) / 50, 0));
                    msg.channel.sendMessage(`Громкость: ${Math.round(dispatcher.volume * 50)}%`);
                } else if (m.content.startsWith('&time')) {
                    msg.channel.sendMessage(`Время: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000) / 1000) < 10 ? '0' + Math.floor((dispatcher.time % 60000) / 1000) : Math.floor((dispatcher.time % 60000) / 1000)}`);
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
            if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('Невозможно подключиться к каналу... Войдите, если вы это не сделали!');
            voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
        });
    },
    'leave': (msg) => {
        return new Promise((resolve, reject) => {
            const voiceChannel = msg.member.voiceChannel;
            if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('Невозможно выйти из канала... Войдите, если вы это не сделали!');
            voiceChannel.leave();
        });
    },
    'add': (msg) => {
        let url = msg.content.split(' ')[1];
        if (url == '' || url === undefined) return msg.channel.sendMessage(`Отправьте ссылку на видео из YouTube, или его параметр v, используя &add`);
        yt.getInfo(url, (err, info) => {
            if (err) return msg.channel.sendMessage('Ошибка получения видео: ' + err);
            if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
            queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
            console.dir(queue[msg.guild.id].songs);
            msg.channel.sendMessage(`Добавлена музыка **${info.title}** в очередь`);
        });
    },
    'queue': (msg) => {
        if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Добавьте песню в очередь через &add`);
        let tosend = [];
        queue[msg.guild.id].songs.forEach((song, i) => {
            tosend.push(`${i + 1}. ${song.title} - Запущено: ${song.requester}`);
        });
        msg.channel.sendMessage(`__**Очередь канала ${msg.guild.name}:**__ �грает сейчас **${tosend.length}** Песен в очереди ${(tosend.length > 15 ? '*[Показано только 15]*' : '')}\r\n\`\`\`${tosend.slice(0, 15).join('\r\n')}\`\`\``);
    },
    'search': (msg) => {
        searches[msg.guild.id] = ['NoVideoInNull'];
        let tos = "";
        msg.content.split(' ').forEach(function (item, i, arr) {
            if (i >= 1) tos += item + " ";
        });
        let msgt = "Выберите видео для отправки через &choose [номер]";
        search(tos, opts, function (err, results) {
            if (err) return msg.reply("Error: " + err);
            let id = 0;
            results.forEach(function (item, i, arr) {
                if (item.kind == 'youtube#video') {
                    id++;
                    msgt += "\r\n" + id + ". **" + item.title + "** от **" + item.channelTitle + "**";
                    searches[msg.guild.id].push(item.id);
                }
            });
            console.log(msgt);
            msg.reply(msgt);
        });
    },
    'choose': (msg) => {
        let id = parseInt(msg.content.split(' ')[1], 10);
        if (id == '' || id === undefined || id == 'NaN') return msg.channel.sendMessage(`Введите верный номер`);
        let idv = "";
        if (searches[msg.guild.id] === undefined) return msg.reply("Сначала нужен поиск командой &search");
        searches[msg.guild.id].forEach(function (item, i, arr) {
            if (i == id) idv = item;
        });
        yt.getInfo(idv, (err, info) => {
            if (err) return msg.channel.sendMessage('Ошибка получения видео: ' + err);
            if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
            queue[msg.guild.id].songs.push({url: idv, title: info.title, requester: msg.author.username});
            msg.channel.sendMessage(`Добавлена музыка **${info.title}** в очередь`);
        });
        searches[msg.guild.id] = [];
    },
    'helpmusic': (msg) => {
        let tosend = ['```', '&join - Присоединиться к каналу отправителя', '&add - Добавить музыку из ссылки YouTube', '&search - Поиск + добавление в очередь из YouTube', '&queue - Показывает очередь до 15ой песни', '&play - Играет очередь', '&leave - Покинуть чат.', '&clear - Очистить очередь.', '', 'Команды управления музыкой-'.toUpperCase(), '&pause - Поставить на паузу', '&resume - Снять с паузы', '&skip - пропустить песню', '&time - Показывает время песни.', 'volume+(+++) - Повышает громкость на 2%/+', 'volume-(---) - Уменьшает громкость на 2%/-', '```'];
        msg.channel.sendMessage(tosend.join('\r\n '));
    }
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

client.on('guildMemberAdd', member => {
    try {
        channel = member.guild.channels.get("472332726998007809");
        channel.send(`Приветствуем на нашем серваке по майнкрафту, ${member}`);
        //member.addRole('495675485716742155');
    } catch (error) {
        console.log(`Ошибка API: ${error}`);
    }
});
client.on("ready", () => {
    ru_initialize();
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setActivity(`&help`, {type: "WATCHING"});
});


client.on("message", async message => {
    if (message.author.bot) return;
    if (!mesarr.hasOwnProperty(message.channel.id)) mesarr[message.channel.id] = 0;
    mesarr[message.channel.id]++;
    if (message.content.toLowerCase().indexOf("&") !==
    0;
)
    {
        if (mesarr[message.channel.id] >= 5 || message.channel.name == 'общалки-с-ботом') {
            mesarr[message.channel.id] = 0;
            let cccc = ru_proceed(message.content, message.channel.name == 'общалки-с-ботом', message.author);
            if (cccc != "") {
                message.reply(cccc);
            }
        }
    );
}
return;
}
const args = message.content.slice(1).trim().split(/ +/g);
const command = args.shift().toLowerCase();
//discord music
if (commands.hasOwnProperty(message.content.toLowerCase().slice(1).split(' ')[0])) commands[message.content.toLowerCase().slice(1).split(' ')[0]](message);
if (command === "testnewuser") {
    channel = message.member.guild.channels.find(ch => ch.name === "чатик");
    try {
        channel.send(`Приветствуем на ${message.guild.name}, ${message.member}`)
    } catch (error) {
        message.reply(`Ошибка API: ${error}`);
    }
}
if (command === "complaint") {
    channel = message.member.guild.channels.find(ch => ch.name === "complaint");
    var prichina = "";
    args.forEach(function (item, i, arr) {
        if (i >= 1) {
            prichina += item + " ";
        }
    });
    channel.send(`Жалоба от ${message.author} на ${args[0]}, по причине: \`\`\`${prichina}\`\`\``);
}
if (command === "help") {
    message.channel.send("```Команды: \r\n \r\n &ping - проверить ping \r\n &purge [число] - очистка данного количества сообщений \r\n &complaint [на кого] [текст жалобы] - пожаловаться на пользователя \r\n &helpmusic - помощь с музыкальным ботом```");
}
if (command === "ping") {
    const m = await message.channel.send("Проверка ping....");
    m.edit(`Проверено! Пинг: ${m.createdTimestamp - message.createdTimestamp}мс. Задержка в API(client ping): ${Math.round(client.ping)}мс`);
}
if (command === "purge") {
    if (message.member.roles.some(r => ["DEV", "STAFF"].includes(r.name))) {

        const deleteCount = parseInt(args[0], 10);
        if (!deleteCount || deleteCount < 2 || deleteCount > 100)
            return message.reply("Введите число от 2 до 100");
        const fetched = await message.channel.fetchMessages({limit: deleteCount});
        message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`Ошибка API: ${error}`));
    } else message.reply("У тебя не привилегий на удаление");
}
})
client.login("Your token");
