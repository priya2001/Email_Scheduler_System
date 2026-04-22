'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill').then(mod => {
  require('react-quill/dist/quill.snow.css');
  return mod;
}), { ssr: false });

const modules = {
  toolbar: [
    ['undo', 'redo'],
    [{ 'font': ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Verdana'] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'undo', 'redo',
  'font', 'size',
  'header',
  'bold', 'italic', 'underline', 'strike',
  'script',
  'blockquote', 'code-block',
  'list', 'indent',
  'color', 'background',
  'align',
  'link', 'image'
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

  const getPresetTimes = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return [
      { label: 'Tomorrow', value: new Date(tomorrow).toISOString() },
      { label: 'Tomorrow, 10:00 AM', value: new Date(new Date(tomorrow).setHours(10, 0, 0, 0)).toISOString() },
      { label: 'Tomorrow, 11:00 AM', value: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)).toISOString() },
      { label: 'Tomorrow, 3:00 PM', value: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)).toISOString() },
    ];
  };

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
      const response = await fetch('http://localhost:3001/api/emails/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const presetTimes = getPresetTimes();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 text-xl">←</button>
          <h1 className="text-lg font-medium text-gray-900">Compose New Email</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Attach file">📎</button>
          <button onClick={() => setShowSendLater(!showSendLater)} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Schedule">⏱️</button>
          <button onClick={handleSendNow} disabled={isSending} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed">
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Compose Area */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="px-6 pt-4 pb-2">
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">{error}</div>
            </div>
          )}

          <div className="px-6 py-4 space-y-4">
            {/* From Field */}
            <div className="flex items-center gap-8">
              <label className="w-16 text-sm font-medium text-gray-700">From</label>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-gray-700">oliver.brown@domain.io</span>
                <button className="text-gray-400 hover:text-gray-600">▼</button>
              </div>
            </div>

            {/* To Field */}
            <div className="flex items-start gap-8">
              <label className="w-16 text-sm font-medium text-gray-700 pt-2">To</label>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 items-center border border-gray-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  {recipients.map((email) => (
                    <div key={email} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center gap-2">
                      {email}
                      <button onClick={() => handleRemoveRecipient(email)} className="text-gray-600 hover:text-gray-800 font-bold">×</button>
                    </div>
                  ))}
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={handleAddRecipient}
                    className="flex-1 outline-none text-sm py-1 px-2 bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Subject Field */}
            <div className="flex items-center gap-8">
              <label className="w-16 text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 outline-none text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Delay and Hourly Limit */}
            <div className="flex items-center gap-8 pt-2">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Delay between emails (sec)</label>
                <input type="number" value={delayBetweenEmails} onChange={(e) => setDelayBetweenEmails(e.target.value)} className="w-16 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm" />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Hourly limit</label>
                <input type="number" value={hourlyLimit} onChange={(e) => setHourlyLimit(e.target.value)} className="w-16 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm" />
              </div>
            </div>

            {/* Formatting Toolbar & Compose Area */}
            <div className="pt-4 border-t border-gray-200">
              <div style={{ height: '400px' }}>
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
            <div className="h-24"></div>
          </div>
        </div>

        {/* Right Sidebar - Send Later */}
        {showSendLater && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Later</h2>

            {/* Pick Date & Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pick date & time</label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Suggested Times */}
            <div className="mb-6 flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">Suggested times:</p>
              <div className="space-y-2">
                {presetTimes.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleSelectTime(preset.value)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition border ${
                      scheduledTime === preset.value
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSendLater(false);
                  setScheduledTime('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendLater}
                disabled={!scheduledTime || isSending}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSending ? 'Scheduling...' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
