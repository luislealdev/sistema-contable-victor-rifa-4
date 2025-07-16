import { getRaffleById } from "@/actions/raffles";
import { RaffleView } from "./ui/RaffleView";
import { notFound } from "next/navigation";

export default async function RafflePage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {

    const { id } = await params;
    const raffleId = parseInt(id);

    if (isNaN(raffleId)) {
        notFound();
    }

    const { ok, raffle } = await getRaffleById(raffleId);

    if (!ok || !raffle) {
        notFound();
    }

    return (
        <RaffleView raffle={raffle} />
    )
}