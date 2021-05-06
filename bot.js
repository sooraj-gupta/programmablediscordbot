'use strict'
//importing required libraries
require('dotenv').config();
const { Client, MessageEmbed } = require ("discord.js");
global.Discord = require( "discord.js");
const client = new Client();
const prefix = process.env.prefix; 
const beautify = require('js-beautify')

//beautify settings
const opts = {
    "indent_size": "2",
}

//user commands to be initialized on 'ready'
let editableCommands = {};

//system default commands
let sysCommands = {
    help: {
        func: ( content, message ) => {
            let description = "**List of Commands:**\n";

            Object.keys( editableCommands ).forEach( ( cmd ) => {
                description += "`"+ cmd  +"`:" + editableCommands[cmd].description+ "\n"
            })
            Object.keys( sysCommands ).forEach( ( cmd ) => {
                description += "`"+ cmd  +"`:" + sysCommands[cmd].description+ "\n"
            })

            const helpEmbed = new MessageEmbed()
                .setTitle( "Bot Help")
                .setColor( 0x00ff00 )
                .setDescription(description)
                .setThumbnail('https://res.cloudinary.com/practicaldev/image/fetch/s--CT4BsRWH--/c_fill,f_auto,fl_progressive,h_320,q_auto,w_320/https://dev-to-uploads.s3.amazonaws.com/uploads/organization/profile_image/2736/f920082b-79f1-40e5-ac80-693bd900b716.png')      

            message.channel.send( helpEmbed );
        },
        description: "List all available commands: $help"
    },
    set: {
        func: ( content, message ) => {
            if( !content.includes( "```js" ) ) return;
            let args = content.split( "```" )
            let newCommand = args[0].split( " " ) [1];
            let func = args[1].slice( 2 );
            let isNew = false;
            if( !editableCommands[ newCommand ] )
            {
                isNew = true;
                editableCommands[ newCommand ] = {};
            }
            editableCommands[ newCommand ].body = func;
            
            // fs.writeFileSync( './editable/commands.json', JSON.stringify( editableCommands, null, "\t" ) );

            message.reply( ( isNew ? "Created" : "Updated" ) + " command: " + newCommand ); 
        },
        description: "Create or edit a command $set <command_name> \\`\\`\\`js <code>\\`\\`\\` "
    },
    getdef:
    {
        func: ( content, message ) => {
            let args = content.split( " " );
            let cmdName = args[1];
            if( editableCommands[ cmdName ])
                message.reply( "Definition of the '"+ cmdName +"' command. ```js\n"+ beautify( editableCommands[ cmdName ].body, opts ) + "```"  );
            else
                message.reply( "The command '" + cmdName + "' does not exist!" );
        },
        description: "Get the code of a command: $getdef <command_name>"
    }
}

const fs = require('fs')


//giphy stuff
var GphApiClient = require('giphy-js-sdk-core');
const { globalAgent } = require('http');
const GIPHY_TOKEN = process.env.GIPHY_TOKEN;
global.giphy = GphApiClient( GIPHY_TOKEN );


//event listeners
client.once( "ready", () => {
    editableCommands = JSON.parse( fs.readFileSync( './editable/commands.json', 'utf8') );
})
client.once( "reconnecting", () => {
    console.log( "reconnecting" );
})
client.once( "disconnect", () => {
    console.log( "disconnected" );
})

//when message is sent
client.on( "message", (message) => {
    
    //continue only if message starts with the prefix and is by the user.
    if( !message.content.startsWith( prefix ) || message.author.bot ) 
        return;

    //remove prefix from message
    const command = message.content.slice( prefix.length );
    
    //get command key
    let key = command.split( " " )[0];

    //execute command if exists in system commands
    if( sysCommands[ key ] )
    {
        sysCommands[ key ].func( command, message );
    }

    //execute command if exists in user commands
    else if( editableCommands[key] )
    {
        var func = new Function( "content", "message", editableCommands[key].body );
        try{
            func( command, message );
        }
        catch( err )
        {
            message.channel.send( "Error while trying to execute command\n```" +  err +"```" );
        }
    }

    return;
})

client.login( process.env.DISCORD_TOKEN );