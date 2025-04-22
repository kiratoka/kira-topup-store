import Invoice from "@/components/Invoice/Invoice"

type PageProps = {
    params: {
        orderId: string
    }
}

const page = ({ params }: PageProps) => {
    const orderId = params.orderId
    return (
        <div>
            <Invoice />
        </div>
    )
}

export default page