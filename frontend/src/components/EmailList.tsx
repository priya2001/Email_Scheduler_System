'use client';

interface Email {
  id: string;
  recipient: string;
  subject: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'draft';
}

interface EmailListProps {
  emails: Email[];
  category: 'scheduled' | 'sent' | 'draft';
}

export default function EmailList({ emails, category }: EmailListProps) {
  const filteredEmails = emails.filter((email) => email.status === category);

  if (filteredEmails.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No {category} emails</p>
          <p className="text-sm">Start composing to create new emails</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {filteredEmails.map((email) => (
        <div
          key={email.id}
          className="bg-white px-8 py-4 hover:bg-gray-50 cursor-pointer transition border-l-4 border-l-transparent hover:border-l-green-600"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                  {email.recipient.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">To: {email.recipient}</p>
                  <p className="text-sm text-gray-600 truncate">{email.subject}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {category === 'scheduled' && (
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full">
                  <span className="text-orange-500 text-sm font-medium">⏰</span>
                  <span className="text-sm text-orange-700 font-medium">{email.scheduledTime}</span>
                </div>
              )}
              {category === 'sent' && (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                  <span className="text-green-500 text-sm font-medium">✓</span>
                  <span className="text-sm text-green-700 font-medium">Sent</span>
                </div>
              )}
              {category === 'draft' && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                  <span className="text-gray-500 text-sm font-medium">✎</span>
                  <span className="text-sm text-gray-700 font-medium">Draft</span>
                </div>
              )}
              <button className="text-gray-400 hover:text-red-500 transition">⋯</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
