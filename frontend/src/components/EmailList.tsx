'use client';

import { Clock3, Star } from 'lucide-react';

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

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredEmails = filteredEmails.filter(
      (email) =>
        email.recipient.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.preview?.toLowerCase().includes(query),
    );
  }

  if (filteredEmails.length === 0) {
    return (
      <div className="flex h-full items-start justify-center px-6 py-8">
        <div className="text-center text-slate-400">
          <p className="text-sm">No {category} emails</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      {filteredEmails.map((email) => (
        <div
          key={email.id}
          className="border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50/70"
        >
          <div className="flex items-center gap-4">
            <div className="min-w-[220px]">
              <p className="text-[16px] font-medium text-slate-900">To: {email.recipient}</p>
            </div>

            {category === 'scheduled' ? (
              <div className="mr-1 inline-flex items-center gap-2 rounded-full border border-orange-300 bg-orange-100 px-3.5 py-1.5 text-[13px] text-orange-700">
                <Clock3 className="h-3.5 w-3.5" />
                {email.scheduledTime}
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-slate-800">
                <span className="font-medium">{email.subject}</span>
                {email.preview ? <span className="text-slate-400"> - {email.preview}</span> : null}
              </p>
            </div>

            <button
              type="button"
              className="ml-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
              aria-label="Star email"
            >
              <Star className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
