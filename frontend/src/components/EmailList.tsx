'use client';

interface Email {
  id: string;
  recipient: string;
  subject: string;
  preview?: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'draft';
}

interface EmailListProps {
  emails: Email[];
  category: 'scheduled' | 'sent' | 'draft';
  searchQuery?: string;
}

export default function EmailList({ emails, category, searchQuery = '' }: EmailListProps) {
  let filteredEmails = emails.filter((email) => email.status === category);
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredEmails = filteredEmails.filter((email) =>
      email.recipient.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.preview?.toLowerCase().includes(query)
    );
  }

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
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0 mt-1">
                  {email.recipient.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">To: <span className="font-semibold">{email.recipient}</span></p>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                      {category === 'sent' && '✓ Sent'}
                      {category === 'scheduled' && '🕐 Scheduled'}
                      {category === 'draft' && '✎ Draft'}
                    </span>
                    <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                  </div>
                  {email.preview && (
                    <p className="text-sm text-gray-600 mt-1 truncate">{email.preview}</p>
                  )}
                </div>
              </div>
            </div>
            {category === 'scheduled' && (
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full text-sm text-orange-700 font-medium flex-shrink-0">
                ⏰ {email.scheduledTime}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
