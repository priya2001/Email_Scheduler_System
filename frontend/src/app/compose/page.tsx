'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/provider';

export default function ComposeEmail() {
  const router = useRouter();
  const supabase = useSupabase();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState('2');
  const [hourlyLimit, setHourlyLimit] = useState('100');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Generate preset time options
  const getPresetTimes = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return [
      {
        label: 'Tomorrow',
        value: new Date(tomorrow).toISOString(),
      },
      {
        label: 'Tomorrow, 10:00 AM',
        value: new Date(new Date(tomorrow).setHours(10, 0, 0, 0)).toISOString(),
      },
      {
        label: 'Tomorrow, 11:00 AM',
        value: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)).toISOString(),
      },
      {
        label: 'Tomorrow, 3:00 PM',
        value: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)).toISOString(),
      },
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
    setShowTimePicker(false);
  };

  const handleSendLater = async () => {
    setError('');

    // Validation
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
      // Send email for each recipient
      const sendPromises = recipients.map((recipient) =>
        fetch('http://localhost:3001/api/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'oliver.brown@domain.io',
            to: recipient,
            subject,
            body,
            scheduledTime: scheduledTime || new Date().toISOString(),
            delayBetweenEmails,
            hourlyLimit,
          }),
        })
      );

      const responses = await Promise.all(sendPromises);
      const allOk = responses.every((res) => res.ok);

      if (!allOk) {
        throw new Error('Failed to schedule some emails');
      }

      // Show success message
      alert(`${recipients.length} email(s) scheduled successfully!`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to schedule email');
      console.error('Error scheduling email:', err);
    } finally {
      setIsSending(false);
    }
  };

  const presetTimes = getPresetTimes();
  const selectedTimeLabel = presetTimes.find((t) => t.value === scheduledTime)?.label || '';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            ←
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Compose New Email</h1>
        </div>
        <div className="flex items-center gap-3 relative">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
            ✏️
          </button>
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
          >
            🕐
          </button>

          {/* Time Picker Popup */}
          {showTimePicker && (
            <div className="absolute right-0 top-16 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50">
              <div className="p-3 border-b border-gray-200">
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="p-3 space-y-2">
                {presetTimes.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleSelectTime(preset.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition ${
                      scheduledTime === preset.value ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSendLater}
            disabled={isSending}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Scheduling...' : 'Send Later'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl space-y-6">
          {/* From Field */}
          <div className="flex items-center gap-4">
            <label className="w-20 text-sm font-medium text-gray-700">From</label>
            <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-gray-700 font-medium flex items-center justify-between cursor-pointer hover:bg-gray-150">
              <span>oliver.brown@domain.io</span>
              <span className="text-gray-400">⌄</span>
            </div>
          </div>

          {/* To Field - Multiple Recipients */}
          <div className="flex items-start gap-4">
            <label className="w-20 text-sm font-medium text-gray-700 mt-3">To</label>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-4 items-start">
                <div className="flex-1 border border-gray-300 rounded-lg p-2 min-h-12 flex flex-wrap gap-2 items-center bg-white focus-within:ring-2 focus-within:ring-green-500">
                  {recipients.map((email) => (
                    <div
                      key={email}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveRecipient(email)}
                        className="text-green-600 hover:text-green-800 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    type="email"
                    placeholder={recipients.length === 0 ? 'recipient@example.com' : 'Add more recipients...'}
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={handleAddRecipient}
                    className="flex-1 outline-none text-sm px-1 bg-transparent"
                  />
                </div>
                <button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium text-sm transition">
                  ⬆ Upload List
                </button>
              </div>
              {recipients.length > 0 && (
                <p className="text-xs text-gray-500">{recipients.length} recipient(s) added</p>
              )}
            </div>
          </div>

          {/* Subject Field */}
          <div className="flex items-center gap-4">
            <label className="w-20 text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
            />
          </div>

          {/* Delay and Hourly Limit */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Delay between 2 emails</label>
            <input
              type="number"
              value={delayBetweenEmails}
              onChange={(e) => setDelayBetweenEmails(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
            />
            <label className="ml-4 text-sm font-medium text-gray-700">Hourly Limit</label>
            <input
              type="number"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-3 flex items-center gap-2 flex-wrap">
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Undo">↶</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Redo">↷</button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Format">T</button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="p-2 hover:bg-gray-200 rounded transition font-bold" title="Bold">B</button>
              <button className="p-2 hover:bg-gray-200 rounded transition italic" title="Italic">I</button>
              <button className="p-2 hover:bg-gray-200 rounded transition underline" title="Underline">U</button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Align Left">≡</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Align Center">≣</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Align Right">≢</button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Bullet List">•</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Numbered List">1.</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Quote">"</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Code">{'</>'}</button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Insert Link">🔗</button>
              <button className="p-2 hover:bg-gray-200 rounded transition" title="Insert Image">🖼</button>
            </div>

            {/* Editor */}
            <textarea
              placeholder="Type Your Reply..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-96 p-4 focus:outline-none resize-none placeholder-gray-400"
            />
          </div>

          {/* Schedule Display */}
          {scheduledTime && (
            <div className="border border-green-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Scheduled for:</p>
                  <p className="text-green-700 font-semibold">{selectedTimeLabel || new Date(scheduledTime).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    setScheduledTime('');
                    setShowTimePicker(false);
                  }}
                  className="text-green-600 hover:text-green-800 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
