const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const fs = require("fs")

async function conectarAWhatsapp(){

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    // Crear la conexion con Whatsapp
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    // Guardar el estado de autenticación
    sock.ev.on('creds.update', saveCreds);

    // Escuchar eventos de conexion
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                conectarAWhatsapp()
            }
        } else if(connection === 'open') {
            console.log('Conexion Abierta...')
        }
    });

    // escuchar Mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        console.log("Mensaje recibido: ", JSON.stringify(m, undefined, 2));

        const message = m.messages[0];
        if(message.key.fromMe && m.type != 'notify'){
            return;
        }

        const id = m.messages[0].key.remoteJid;
        const nombre = m.messages[0].pushName;
        const mensaje = m.messages[0].message?.conversation ||
                        m.messages[0].message?.extendedTextMessage?.text ||
                        m.messages[0].message?.text;
        
        // Lectura de mensajes
        await sock.readMessages([m.messages[0].key])

        // esperamos 
        await sleep(200);
        // escribiendo
        await sock.sendPresenceUpdate("composing", id)
        await sleep(3000);
        
        // enviar mensaje de texto
        await sock.sendMessage(id, {text: "Hola "+nombre+", Bienvenido a mi BOT (Soy un ejemplo...) y el mensaje que acabas de mandar es: " +mensaje + "\nVisita mi pagina o sigueme: https://github.com/cchura94"});

        // respuesta a mensajes
        await sock.sendMessage(id, {text: "Respuesta a tu mensaje"}, {quoted: m.messages[0]})

        await sock.sendMessage(id, { text: 'Hola Saludos a: @59173277937', mentions: ['59173277937@s.whatsapp.net'] })

        // escribiendo
        await sleep(200);
        await sock.sendPresenceUpdate("composing", id)
        await sleep(3000);

        // send a location!
        await sock.sendMessage(id, {text: "Nuestra dirección es: Av 123 Zona ABC o ingrese en google maps:"});

        const sentMsg  = await sock.sendMessage(
            id, 
            { location: { degreesLatitude: 24.121231, degreesLongitude: 55.1121221 } }
        )

        // send a contact!
        const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
        + 'VERSION:3.0\n' 
        + 'FN:Jeff Singh\n' // full name
        + 'ORG:Ashoka Uni;\n' // the organization of the contact
        + 'TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\n' // WhatsApp ID + phone number
        + 'END:VCARD'
        const sentMsg2  = await sock.sendMessage(id, { contacts: { displayName: 'Jeff', contacts: [{ vcard }] } })
    
    
        const reactionMessage = {
            react: {
                text: "💖", // use an empty string to remove the reaction
                key: m.messages[0].key
            }
        }
        
        const sendMsg = await sock.sendMessage(id, reactionMessage);


        // mensajes multimedia imagen
        await sock.sendMessage(id, {image: {url: "https://img.freepik.com/foto-gratis/dispositivos-tecnologicos-reflejos_1232-471.jpg"}})

         // mensajes multimedia imagen con caption (59178844793)
         await sock.sendMessage(id, {
            image: {
                url: "https://img.freepik.com/foto-gratis/dispositivos-tecnologicos-reflejos_1232-471.jpg"}, 
                caption: `Hola este es una Laptop\nNueva\nescribe *información* ...\nsi requiere más información escribenos.\n> visita: blumbit.net`
            })
        // enviar audio mp3
        await sock.sendMessage(id, {audio: { url: "./Media/mi-audio.mp3" }, mimetype: 'audio/mp4', ptt: false})

        // enviar audio mp3
        await sock.sendMessage(id, {audio: { url: "./Media/mi-audio.mp3" }, ptt: true})

        // video
        await sock.sendMessage(id, {video: fs.readFileSync("Media/mi-video.mp4")})
        // video caption
        await sock.sendMessage(id, {video: fs.readFileSync("Media/mi-video.mp4"), caption: `Hola este es una Laptop\nNueva\nescribe *información* ...\nsi requiere más información escribenos.\n> visita: blumbit.net`})
        // ptv  en tre
        await sock.sendMessage(id, {video: fs.readFileSync("Media/mi-video.mp4"), ptv: true})
        // gif
        await sock.sendMessage(id, {video: fs.readFileSync("Media/mi-video.mp4"), gifPlayback: true})



        

    
    })

}

conectarAWhatsapp();

function sleep(ms){
    return new Promise((resolve) => setTimeout(resolve, ms));
}