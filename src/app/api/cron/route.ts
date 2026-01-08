import { NextResponse } from 'next/server';
import { sendWhatsApp } from '@/utils/send-whatsapp';
import prisma from '@/lib/prisma';

// Función auxiliar para obtener rifas con fechas específicas
async function getRafflesForTomorrowCustom(startDate: Date, endDate: Date) {
    try {
        const raffles = await prisma.raffle.findMany({
            where: {
                drawDate: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                tickets: {
                    include: {
                        client: true,
                        payments: true,
                    },
                },
            },
        });

        return {
            success: true,
            raffles,
        };
    } catch (error) {
        console.error('Error fetching raffles for custom dates:', error);
        return {
            success: false,
            error: 'Error al obtener las rifas para las fechas especificadas',
        };
    }
}

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar zona horaria de México (UTC-6)
    const now = new Date();
    const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    
    console.log('🎲 Cron job de rifas ejecutado en:', now.toISOString());
    console.log('🇲🇽 Hora de México:', mexicoTime.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }));
    console.log('');

    try {
        // Calcular mañana en zona horaria de México
        const tomorrow = new Date(mexicoTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        console.log(`🗓️ Buscando rifas para: ${tomorrow.toLocaleDateString('es-MX')}`);
        console.log(`🕐 Rango de búsqueda: ${tomorrow.toISOString()} a ${endOfTomorrow.toISOString()}`);
        console.log('');

        // Obtener rifas cuyo sorteo es mañana (con fechas calculadas localmente)
        const rafflesResult = await getRafflesForTomorrowCustom(tomorrow, endOfTomorrow);

        if (!rafflesResult.success) {
            console.log('❌ Error al obtener rifas de mañana:', rafflesResult.error);
            return NextResponse.json({ error: rafflesResult.error }, { status: 500 });
        }

        const raffles = rafflesResult.raffles || [];

        if (raffles.length === 0) {
            console.log('✅ No hay rifas programadas para mañana');
            return NextResponse.json({
                ok: true,
                message: 'No hay rifas programadas para mañana',
                rafflesCount: 0,
                unpaidTicketsCount: 0,
                whatsappStats: {
                    messagesAttempted: 0,
                    messagesSuccessful: 0,
                    messagesFailed: 0
                }
            });
        }

        console.log(`🎲 RIFAS PROGRAMADAS PARA MAÑANA: ${raffles.length}`);
        console.log('='.repeat(50));

        let totalUnpaidTickets = 0;
        let messagesAttempted = 0;
        let messagesSuccessful = 0;
        let messagesFailed = 0;

        for (const [raffleIndex, raffle] of raffles.entries()) {
            console.log(`\n${raffleIndex + 1}. 🎲 ${raffle.title}`);
            console.log(`   📅 Fecha del sorteo: ${raffle.drawDate.toLocaleDateString('es-MX')}`);
            console.log(`   💰 Precio del boleto: $${raffle.ticketPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
            console.log(`   🏆 Premio: ${raffle.prize}`);
            console.log(`   🎫 Total de boletos: ${raffle.tickets.length}`);

            if (raffle.tickets.length === 0) {
                console.log(`   ✅ No hay boletos vendidos para esta rifa`);
                continue;
            }

            // Filtrar tickets no pagados completamente
            const unpaidTickets = raffle.tickets.filter(ticket => {
                const amountOwed = raffle.ticketPrice - ticket.totalPaid;
                return amountOwed > 0;
            });

            console.log(`   💸 Boletos no pagados completamente: ${unpaidTickets.length}`);
            totalUnpaidTickets += unpaidTickets.length;

            if (unpaidTickets.length === 0) {
                console.log(`   ✅ Todos los boletos están pagados completamente`);
                continue;
            }

            console.log(`\n   📋 BOLETOS CON PAGOS PENDIENTES:`);
            console.log(`   ${'='.repeat(40)}`);

            for (const [ticketIndex, ticket] of unpaidTickets.entries()) {
                const amountOwed = raffle.ticketPrice - ticket.totalPaid;
                const percentagePaid = (ticket.totalPaid / raffle.ticketPrice) * 100;

                console.log(`\n   ${ticketIndex + 1}. 🎫 Boleto #${ticket.number}`);
                console.log(`      👤 Cliente: ${ticket.client.name}${ticket.clientAlias ? ` (${ticket.clientAlias})` : ''}`);
                console.log(`      📱 Teléfono: ${ticket.client.phone || 'No registrado'}`);
                console.log(`      💰 Precio del boleto: $${raffle.ticketPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                console.log(`      💸 Total pagado: $${ticket.totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                console.log(`      ⚠️  Monto adeudado: $${amountOwed.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                console.log(`      📊 Porcentaje pagado: ${percentagePaid.toFixed(1)}%`);

                // Enviar mensaje de WhatsApp si tiene teléfono
                if (ticket.client.phone && ticket.client.phone.trim() !== '') {
                    console.log(`      📲 Enviando recordatorio por WhatsApp...`);

                    const clientName = ticket.clientAlias || ticket.client.name;
                    const message = `Hola ${clientName},

¡Recordatorio importante! 🎲

El sorteo de la rifa "${raffle.title}" será *MAÑANA ${raffle.drawDate.toLocaleDateString('es-MX')}* y tu boleto #${ticket.number} aún tiene un saldo pendiente.

*DETALLES DE TU BOLETO:*
🎫 Número: ${ticket.number}
💰 Precio total: $${raffle.ticketPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
💸 Ya pagaste: $${ticket.totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
⚠️ Te falta: $${amountOwed.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

🏆 Premio: ${raffle.prize}

*¡ES IMPORTANTE QUE TE PONGAS AL CORRIENTE HOY PARA PODER PARTICIPAR EN EL SORTEO DE MAÑANA!*

Por favor, acércate a liquidar tu boleto antes del sorteo.

¡Gracias y mucha suerte! 🍀`;

                    try {
                        messagesAttempted++;
                        await sendWhatsApp(ticket.client.phone, message);
                    } catch (error) {
                        messagesFailed++;
                        console.log(`      ❌ Error al enviar mensaje de WhatsApp:`, error);
                    }
                } else {
                    console.log(`      ⚠️  Sin teléfono registrado - no se puede enviar mensaje`);
                }

                console.log(`      ${'─'.repeat(40)}`);
            }
        }

        // Resumen final
        console.log('\n📊 RESUMEN EJECUTIVO:');
        console.log('='.repeat(50));
        console.log(`🎲 Rifas revisadas: ${raffles.length}`);
        console.log(`🎫 Total de boletos no pagados: ${totalUnpaidTickets}`);
        console.log('');
        console.log('📲 RESUMEN DE MENSAJES DE WHATSAPP:');
        console.log('===================================');
        console.log(`📤 Mensajes intentados: ${messagesAttempted}`);
        console.log(`✅ Mensajes exitosos: ${messagesSuccessful}`);
        console.log(`❌ Mensajes fallidos: ${messagesFailed}`);

        if (messagesSuccessful > 0) {
            console.log(`\n🎯 Se enviaron ${messagesSuccessful} recordatorios exitosamente`);
        }

        console.log('\n✅ Proceso de revisión de rifas completado exitosamente');
        console.log('');

        return NextResponse.json({
            ok: true,
            rafflesCount: raffles.length,
            unpaidTicketsCount: totalUnpaidTickets,
            whatsappStats: {
                messagesAttempted,
                messagesSuccessful,
                messagesFailed
            }
        });

    } catch (error) {
        console.log('❌ Error inesperado en el cron job de rifas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
