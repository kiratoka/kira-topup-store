type PageProps = {
    params: {
        id: string
    }
}

const page = ({ params }: PageProps) => {
    const invoiceId = params.id
    return (
        <div className="text-white text-2xl">Invoice Id: {invoiceId}</div>
    )
}

export default page