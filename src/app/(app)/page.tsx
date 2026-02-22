import { notFound } from "next/navigation";
import { RaffleView } from './ui/RaffleView';
import { getRaffleById } from '../../actions/raffles';

export default async function RafflePage() {

    const { ok, raffle } = await getRaffleById(6);

    if (!ok || !raffle) {
        notFound();
    }

    return (
        <RaffleView raffle={raffle} />
    )
}