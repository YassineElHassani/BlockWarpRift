interface Props {
  return (
    <div>
      <h1>Payment</h1>
      <p>This payment page is not implemented yet.</p>
    </div>
  );
}

export default async function PaymentPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Payment {id}</h1>
    </main>
  );
}
