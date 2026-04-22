'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  Paperclip,
  Send,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

const ReactQuill = dynamic(
  () =>
    import('react-quill').then((mod) => {
      require('react-quill/dist/quill.snow.css');
      return mod;
    }),
  { ssr: false },
);

const modules = {
  toolbar: [
    ['undo', 'redo'],
    [{ font: ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Verdana'] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ script: 'sub' }, { script: 'super' }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const formats = [
  'undo',
  'redo',
  'font',
  'size',
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'script',
  'blockquote',
  'code-block',
  'list',
  'indent',
  'color',
  'background',
  'align',
  'link',
  'image',
];

export default function ComposeEmail() {
  const router = useRouter();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState('2');
  const [hourlyLimit, setHourlyLimit] = useState('100');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSendLater, setShowSendLater] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const presetTimes = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return [
      { label: 'Tomorrow', value: new Date(tomorrow).toISOString() },
      { label: 'Tomorrow, 10:00 AM', value: new Date(new Date(tomorrow).setHours(10, 0, 0, 0)).toISOString() },
      { label: 'Tomorrow, 11:00 AM', value: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)).toISOString() },
      { label: 'Tomorrow, 3:00 PM', value: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)).toISOString() },
    ];
  }, []);

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && recipientInput.trim()) {
      e.preventDefault();
      if (!recipients.includes(recipientInput.trim())) {
        setRecipients([...recipients, recipientInput.trim()]);
        setRecipientInput('');
      }
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSelectTime = (time: string) => {
    setScheduledTime(time);
  };

  const performSend = async () => {
    setError('');

    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter subject');
      return;
    }

    setIsSending(true);
    try {
      const response = await apiFetch('/api/emails/bulk', {
        method: 'POST',
        body: JSON.stringify({
          from: 'oliver.brown@domain.io',
          recipients,
          subject,
          body,
          scheduledTime: scheduledTime || new Date().toISOString(),
          delayBetweenEmails,
          hourlyLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to schedule emails');
      }

      const createdCount = data?.data?.createdCount ?? recipients.length;
      alert(`${createdCount} email(s) scheduled successfully!`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to schedule email');
      console.error('Error scheduling email:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNow = async () => {
    setScheduledTime('');
    await performSend();
  };

  const handleSendLater = async () => {
    if (!scheduledTime) {
      setError('Please select a date and time to send later');
      return;
    }

    await performSend();
    setShowSendLater(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
            type="button"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900">
            Compose New Email
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            title="Attach file"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Paperclip className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setShowSendLater(!showSendLater)}
            title="Schedule"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Clock3 className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleSendNow}
            disabled={isSending}
            className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-500 px-8 text-[18px] font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="mr-2 h-4.5 w-4.5" />
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-73px)] overflow-hidden bg-white">
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-10">
          <div className="mx-auto w-full max-w-[1280px]">
            {error && (
              <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-8">
              <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <label className="text-[16px] text-slate-900">From</label>
                <div className="inline-flex max-w-[320px] items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-[18px] text-slate-800">
                  <span className="truncate">oliver.brown@domain.io</span>
                  <ChevronDown className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <label className="text-[16px] text-slate-900">To</label>
                <div className="min-w-0 border-b border-slate-200 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {recipients.map((email) => (
                      <div key={email} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[14px] text-slate-800">
                        {email}
                        <button
                          onClick={() => handleRemoveRecipient(email)}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-700"
                          type="button"
                          aria-label={`Remove ${email}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={handleAddRecipient}
                      className="min-w-[220px] flex-1 border-0 bg-transparent text-[18px] text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <label className="text-[16px] text-slate-900">Subject</label>
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[18px] text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <div className="text-[16px] text-slate-900">Delay between 2 emails</div>
                <div className="flex items-center gap-10">
                  <input
                    type="number"
                    value={delayBetweenEmails}
                    onChange={(e) => setDelayBetweenEmails(e.target.value)}
                    className="h-12 w-[92px] rounded-xl border border-slate-200 bg-white px-3 text-center text-[16px] text-slate-600 outline-none focus:border-slate-300"
                  />
                  <div className="text-[16px] text-slate-900">Hourly Limit</div>
                  <input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(e.target.value)}
                    className="h-12 w-[92px] rounded-xl border border-slate-200 bg-white px-3 text-center text-[16px] text-slate-600 outline-none focus:border-slate-300"
                  />
                </div>
              </div>

              <div className="rounded-[18px] bg-slate-50/70 p-3">
                <div className="min-h-[560px] rounded-[18px] bg-white">
                  <ReactQuill
                    theme="snow"
                    value={body}
                    onChange={setBody}
                    modules={modules}
                    formats={formats}
                    placeholder="Type Your Reply..."
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSendLater && (
          <aside className="absolute right-6 top-6 z-20 w-[470px] rounded-xl border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.12)]">
            <div className="p-5">
              <h2 className="text-[22px] font-medium text-slate-900">Send Later</h2>

              <div className="mt-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-transparent text-[18px] text-slate-500 outline-none placeholder:text-slate-400"
                  />
                  <CalendarDays className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {presetTimes.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleSelectTime(preset.value)}
                    className={`block w-full text-left text-[18px] text-slate-600 transition hover:text-slate-900 ${
                      scheduledTime === preset.value ? 'text-slate-900' : ''
                    }`}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-8 border-t border-slate-200 px-5 py-4">
              <button
                onClick={() => {
                  setShowSendLater(false);
                  setScheduledTime('');
                }}
                className="text-[18px] text-slate-900 transition hover:text-slate-700"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSendLater}
                disabled={!scheduledTime || isSending}
                className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-500 px-8 text-[18px] font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {isSending ? 'Scheduling...' : 'Done'}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
