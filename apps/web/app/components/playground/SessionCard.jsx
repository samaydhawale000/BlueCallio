export default function SessionCard({
  session,
  copy,
  joinCaller,
  joinReceiver,
}) {
  return (
    <div className="bg-white rounded-2xl border mt-10 p-8">

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-semibold">
            Test Session Created
          </h2>

          <p className="text-gray-500 mt-1">
            Ready for testing
          </p>

        </div>

        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
          Active
        </span>

      </div>

      <div className="mt-8">

        <label className="font-semibold">
          Call ID
        </label>

        <div className="bg-gray-100 p-3 rounded-lg mt-2 break-all">
          {session.callId}
        </div>

      </div>

      {/* Caller */}

      <div className="mt-8">

        <label className="font-semibold">
          Caller
        </label>

        <div className="flex gap-3 mt-2">

          <input
            readOnly
            value={session.callerUrl}
            className="border rounded-lg flex-1 p-3"
          />

          <button
            onClick={() => copy(session.callerUrl)}
            className="px-5 rounded-lg bg-gray-900 text-white"
          >
            Copy
          </button>

          <button
            onClick={joinCaller}
            className="px-5 rounded-lg bg-green-600 text-white"
          >
            Open
          </button>

        </div>

      </div>

      {/* Receiver */}

      <div className="mt-8">

        <label className="font-semibold">
          Receiver
        </label>

        <div className="flex gap-3 mt-2">

          <input
            readOnly
            value={session.receiverUrl}
            className="border rounded-lg flex-1 p-3"
          />

          <button
            onClick={() => copy(session.receiverUrl)}
            className="px-5 rounded-lg bg-gray-900 text-white"
          >
            Copy
          </button>

          <button
            onClick={joinReceiver}
            className="px-5 rounded-lg bg-blue-600 text-white"
          >
            Open
          </button>

        </div>

      </div>

    </div>
  );
}