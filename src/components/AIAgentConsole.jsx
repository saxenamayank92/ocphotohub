import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, RefreshCw, Terminal, User } from 'lucide-react';
import { sendAgentChatCommand } from '../api';

export default function AIAgentConsole({ onRefreshLeads }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Outreach is paused. I can research accounts, prepare review batches, and audit contact history. Sending requires verified recipients and explicit approval.",
      toolAction: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (customText = null) => {
    const text = (customText || inputPrompt).trim();
    if (!text || isProcessing) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputPrompt('');
    setIsProcessing(true);
    setActiveStep('Contacting backend agent worker engine...');

    try {
      // Send command to live backend endpoint
      const res = await sendAgentChatCommand({ prompt: text });

      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: res.reply || 'Hunter completed the analysis. No email was sent.',
          toolAction: res.toolAction || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (res.outcome && res.outcome !== 'analysis' && onRefreshLeads) onRefreshLeads();
    } catch (err) {
      console.warn('Backend agent call failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: `Hunter could not reach the server. No leads were sourced and no emails were sent. ${err.message || ''}`.trim(),
          toolAction: null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
      setActiveStep(null);
    }
  };

  return (
    <div className="ai-agent-console-card">
      <div className="agent-console-header">
        <div className="agent-branding">
          <div className="agent-avatar">
            <Bot size={20} className="text-amber" />
            <span className="online-indicator" />
          </div>
          <div>
            <div className="agent-title-row">
              <h3>Hunter — Autonomous AI Sales Co-Pilot</h3>
              <span className="agent-badge">AI AGENT V2</span>
            </div>
            <p>Research, prioritization, drafting, and suppression auditing</p>
          </div>
        </div>

        <div className="agent-controls">
          <div className="autopilot-toggle"><span className="autopilot-label">Campaign:</span><button className="toggle-btn" disabled>PAUSED</button></div>
        </div>
      </div>

      {/* Chat Messages Console */}
      <div className="agent-chat-window">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message-row ${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className="msg-content-wrap">
              <div className="msg-meta">
                <strong>{msg.role === 'assistant' ? 'Hunter AI' : 'Mayank Saxena'}</strong>
                <small>{msg.timestamp}</small>
              </div>

              {msg.toolAction && (
                <div className="tool-action-badge">
                  <Terminal size={12} />
                  <span>EXECUTED TOOL: <strong>{msg.toolAction}</strong></span>
                </div>
              )}

              <div className="msg-bubble">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="chat-message-row assistant processing-row">
            <div className="msg-avatar"><Bot size={16} className="spin-slow" /></div>
            <div className="msg-content-wrap">
              <div className="msg-meta">
                <strong>Hunter AI</strong>
                <small>Executing...</small>
              </div>
              <div className="msg-bubble processing-bubble">
                <RefreshCw size={14} className="spin" />
                <span>{activeStep || 'Autonomous AI reasoning in progress...'}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="agent-quick-chips">
        <button
          type="button"
          className="quick-chip"
          onClick={() => handleSendMessage('who should be targeted next?')}
          disabled={isProcessing}
        >
          🎯 Target Queue
        </button>
        <button
          type="button"
          className="quick-chip highlight"
          onClick={() => handleSendMessage('target next 20 clubs')}
          disabled={isProcessing}
        >
          Build Review Batch
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={() => handleSendMessage('who has been contacted?')}
          disabled={isProcessing}
        >
          📋 Outreach Audit
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={() => handleSendMessage('dispatch follow-ups')}
          disabled={isProcessing}
        >
          Review Follow-Up Candidates
        </button>
      </div>

      {/* Interactive Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="agent-input-bar">
        <input
          type="text"
          placeholder="Ask Hunter to research, prioritize, draft, or audit suppression history"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing || !inputPrompt.trim()} className="btn-send-agent">
          <Send size={15} /> Send Command
        </button>
      </form>

    </div>
  );
}
