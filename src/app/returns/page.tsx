import { getReturns } from '@/app/actions/returns'
import { ReturnsListClient } from '@/components/ReturnsListClient'

export const dynamic = 'force-dynamic'

export default async function ReturnsPage() {
    const returns = await getReturns()

    return (
        <ReturnsListClient returns={JSON.parse(JSON.stringify(returns))} />
    )
}
