export const sendWhatsApp = async (phone: string, message: string) => {
    console.log(process.env.WAHA_API_KEY);

    const response = await fetch('https://whatsapp-api.creativa2020.com.mx/api/sendText', {

        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.WAHA_API_KEY || '', //
        },

        body: JSON.stringify({
            chatId: `${"521" + phone}@c.us`,
            text: message,
            session: "default"
        })
    });

    console.log("Response from WhatsApp API:", response);

}  