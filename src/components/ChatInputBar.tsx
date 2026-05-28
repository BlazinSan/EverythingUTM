import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef } from "react";
import { ImagePlus, Mic, Paperclip, Send, Square, X } from "lucide-react";

import type { ChatAttachment } from "../types";
import "./ChatInputBar.css";

export default function ChatInputBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  attachments,
  onAttach,
  onRemoveAttachment,
  replyPreview,
  onCancelReply,
  voicePreview,
  onClearVoice,
  isRecordingVoice,
  isSending,
  onToggleVoice,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
  attachments: ChatAttachment[];
  onAttach: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (id: string) => void;
  replyPreview?: ReactNode;
  onCancelReply?: () => void;
  voicePreview?: ReactNode;
  onClearVoice?: () => void;
  isRecordingVoice: boolean;
  isSending?: boolean;
  onToggleVoice: () => void;
  children?: ReactNode;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <form className="chat-input-bar" onSubmit={onSubmit}>
      {replyPreview && (
        <div className="reply-composer chat-input-reply">
          <div>{replyPreview}</div>
          <button
            className="icon-button"
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="chat-attachment-tray">
          {attachments.map((attachment) => (
            <div className="chat-attachment-chip" key={attachment.id}>
              {attachment.kind === "image" ? (
                <img src={attachment.url} alt="" />
              ) : attachment.kind === "video" ? (
                <video src={attachment.url} muted playsInline />
              ) : (
                <Paperclip size={16} aria-hidden="true" />
              )}
              <span>{attachment.name}</span>
              <small>{(attachment.size / 1024 / 1024).toFixed(2)} MB</small>
              <button
                type="button"
                onClick={() => onRemoveAttachment(attachment.id)}
                aria-label={`Remove ${attachment.name}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {voicePreview && (
        <div className="voice-preview chat-input-voice-preview">
          {voicePreview}
          {onClearVoice && (
            <button
              className="icon-button"
              type="button"
              onClick={onClearVoice}
              aria-label="Remove voice message"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="chat-input-shell">
        <label className="icon-button attachment-button" title="Add picture, video, or file">
          <ImagePlus size={17} aria-hidden="true" />
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            onChange={onAttach}
          />
        </label>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={placeholder}
          rows={1}
        />
        {children}
        <button
          className={`icon-button voice-button ${isRecordingVoice ? "is-recording" : ""}`}
          type="button"
          title={isRecordingVoice ? "Stop recording" : "Record voice message"}
          onClick={onToggleVoice}
        >
          {isRecordingVoice ? (
            <Square size={15} aria-hidden="true" />
          ) : (
            <Mic size={17} aria-hidden="true" />
          )}
        </button>
        <button
          className="primary-button chat-send-button"
          type="submit"
          disabled={isSending}
          title={isSending ? "Sending voice message..." : "Send message"}
        >
          {isSending ? (
            <span className="chat-send-loading">Sending...</span>
          ) : (
            <Send size={17} aria-hidden="true" />
          )}
        </button>
      </div>
    </form>
  );
}
