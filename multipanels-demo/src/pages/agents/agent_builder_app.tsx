import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  EuiAvatar,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiCodeBlock,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiLoadingSpinner,
  EuiMarkdownFormat,
  EuiPanel,
  EuiPopover,
  EuiSelectable,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTextArea,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  type EuiBasicTableColumn,
  type EuiSelectableOption,
} from '@elastic/eui';
import { useBreadcrumbs } from '../../chrome/chrome_context';
import { formatDate, formatRelative } from '../../components/formatters';
import { useToasts } from '../../components/toasts';
import { CAPABILITY_MESSAGES, DEFAULT_AGENT_ID, MANAGE_NAV_ITEMS, SUGGESTED_PROMPTS, type Agent, type Conversation, type Message, type ToolCallStep } from '../../data/agents';
import { useAgentBuilder } from './agent_builder_state';

const SIDEBAR_WIDTH = 300;
const CONTENT_MAX_WIDTH = 860;

const AgentAvatar: React.FC<{ agent: Agent; size?: 's' | 'm' | 'l' | 'xl' }> = ({ agent, size = 's' }) => (
  <EuiAvatar name={agent.name} initials={agent.avatarSymbol} color={agent.avatarColor} size={size} type="space" />
);

/* ------------------------------------------------------------------ sidebar */

const AgentSelector: React.FC<{ agentId: string; onSelect: (id: string) => void }> = ({ agentId, onSelect }) => {
  const { agents } = useAgentBuilder();
  const [isOpen, setIsOpen] = useState(false);
  const agent = agents.find((a) => a.id === agentId) ?? agents[0];
  const options: EuiSelectableOption[] = agents.map((a) => ({
    key: a.id,
    label: a.name,
    checked: a.id === agentId ? 'on' : undefined,
    prepend: <AgentAvatar agent={a} />,
    append: a.isSpaceDefault ? <EuiBadge color="hollow">Space default</EuiBadge> : undefined,
  }));
  return (
    <EuiPopover
      button={
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          data-test-subj="agentBuilderAgentSelector"
          css={css`
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 6px 8px;
            border-radius: 6px;
            text-align: left;
            &:hover {
              background: rgba(0, 0, 0, 0.04);
            }
          `}
        >
          <AgentAvatar agent={agent} size="m" />
          <span css={css`flex: 1; min-width: 0;`}>
            <EuiText size="s" className="eui-textTruncate">
              <strong>{agent.name}</strong>
            </EuiText>
            <EuiText size="xs" color="subdued">
              {agent.type === 'Elastic' ? 'Preconfigured' : 'Custom'} agent
            </EuiText>
          </span>
          <EuiIcon type="chevronSingleDown" size="s" color="subdued" />
        </button>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiSelectable
        singleSelection="always"
        options={options}
        onChange={(next) => {
          const picked = next.find((o) => o.checked === 'on');
          if (picked) onSelect(picked.key as string);
          setIsOpen(false);
        }}
        listProps={{ bordered: false, rowHeight: 40 }}
        css={css`
          width: 320px;
        `}
      >
        {(list) => list}
      </EuiSelectable>
    </EuiPopover>
  );
};

const ConversationRow: React.FC<{ conversation: Conversation; isActive: boolean }> = ({ conversation, isActive }) => {
  const { euiTheme } = useEuiTheme();
  const navigate = useNavigate();
  const { togglePinned, markRead, deleteConversation, renameConversation } = useAgentBuilder();
  const { addToast } = useToasts();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => {
        markRead(conversation.id);
        navigate(`/agents/conversations/${conversation.id}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/agents/conversations/${conversation.id}`);
      }}
      data-test-subj={`conversationListItem-${conversation.id}`}
      css={css`
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 4px 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        background: ${isActive ? euiTheme.colors.backgroundBaseInteractiveSelect : 'transparent'};
        &:hover {
          background: ${isActive ? euiTheme.colors.backgroundBaseInteractiveSelect : euiTheme.colors.backgroundBaseSubdued};
        }
        &:hover .conversationRow__menu {
          opacity: 1;
        }
      `}
    >
      {conversation.unread && <span css={css`width: 6px; height: 6px; border-radius: 50%; background: ${euiTheme.colors.primary}; flex: none;`} />}
      <EuiText size="s" className="eui-textTruncate" css={css`flex: 1; min-width: 0; font-weight: ${conversation.unread ? 600 : 400};`}>
        {conversation.title}
      </EuiText>
      <span className="conversationRow__menu" css={css`opacity: ${menuOpen ? 1 : 0}; transition: opacity 0.1s;`} onClick={(e) => e.stopPropagation()}>
        <EuiPopover
          button={<EuiButtonIcon iconType="ellipsis" size="xs" color="text" aria-label="Open conversation menu" onClick={() => setMenuOpen((o) => !o)} />}
          isOpen={menuOpen}
          closePopover={() => setMenuOpen(false)}
          panelPaddingSize="none"
          anchorPosition="rightUp"
        >
          <EuiContextMenuPanel
            items={[
              <EuiContextMenuItem key="pin" icon="pin" onClick={() => { togglePinned(conversation.id); setMenuOpen(false); }}>
                {conversation.pinned ? 'Unpin' : 'Pin'}
              </EuiContextMenuItem>,
              <EuiContextMenuItem key="rename" icon="pencil" onClick={() => { const next = window.prompt('Rename conversation', conversation.title); if (next) renameConversation(conversation.id, next); setMenuOpen(false); }}>
                Rename
              </EuiContextMenuItem>,
              <EuiContextMenuItem key="share" icon="share" onClick={() => { addToast({ title: 'Link copied', color: 'success', iconType: 'check' }); setMenuOpen(false); }}>
                Share
              </EuiContextMenuItem>,
              <EuiContextMenuItem key="delete" icon="trash" css={css`color: ${euiTheme.colors.textDanger};`} onClick={() => { deleteConversation(conversation.id); setMenuOpen(false); if (isActive) navigate('/agents/conversations/new'); }}>
                Delete
              </EuiContextMenuItem>,
            ]}
          />
        </EuiPopover>
      </span>
    </div>
  );
};

const SidebarSectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EuiText size="xs" color="subdued" css={css`padding: 4px 8px;`}>
    {children}
  </EuiText>
);

const ConversationSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { conversations, selectedAgentId, setSelectedAgentId } = useAgentBuilder();
  const { addToast } = useToasts();
  const [search, setSearch] = useState('');
  const activeId = pathname.match(/\/agents\/conversations\/([^/]+)/)?.[1];

  const forAgent = conversations.filter((c) => c.agentId === selectedAgentId && (!search || c.title.toLowerCase().includes(search.toLowerCase())));
  const pinned = forAgent.filter((c) => c.pinned);
  const chats = forAgent.filter((c) => !c.pinned).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <EuiFlexGroup direction="column" gutterSize="none" responsive={false} className="eui-fullHeight" data-test-subj="agentBuilderSidebar-conversation">
      <EuiFlexItem grow={false} css={css`padding: 8px 8px 4px;`}>
        <AgentSelector
          agentId={selectedAgentId}
          onSelect={(id) => {
            setSelectedAgentId(id);
            navigate('/agents/conversations/new');
          }}
        />
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" responsive={false}>
          <EuiFlexItem>
            <EuiButton size="s" iconType="plus" fill onClick={() => navigate('/agents/conversations/new')} data-test-subj="agentBuilderNewConversationButton">
              New
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton size="s" iconType="search" onClick={() => addToast({ title: 'Search modal is not part of this demo — use the filter below', color: 'primary' })}>
              Search
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiFieldSearch compressed placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search chats" />
      </EuiFlexItem>
      <EuiHorizontalRule margin="s" />
      <EuiFlexItem grow css={css`overflow-y: auto; padding: 0 8px;`}>
        <SidebarSectionLabel>Customize</SidebarSectionLabel>
        <div css={css`display: flex; flex-direction: column;`}>
          {[
            { label: 'Agent settings', icon: 'gear', href: `/agents/manage/agents/${selectedAgentId}` },
            { label: 'Tools', icon: 'wrench', href: undefined },
            { label: 'Skills', icon: 'sparkles', href: undefined },
          ].map((item) => (
            <EuiToolTip key={item.label} content={item.href ? undefined : `${item.label} — not part of this demo`} position="right" display="block">
              <EuiButtonEmpty
                size="s"
                color="text"
                iconType={item.icon}
                flush="left"
                isDisabled={!item.href}
                onClick={() => item.href && navigate(item.href)}
                css={css`
                  width: 100%;
                  justify-content: flex-start;
                  padding-left: 8px;
                `}
              >
                {item.label}
              </EuiButtonEmpty>
            </EuiToolTip>
          ))}
        </div>
        <EuiSpacer size="m" />
        <SidebarSectionLabel>Pinned</SidebarSectionLabel>
        {pinned.length === 0 ? (
          <EuiText size="xs" color="subdued" css={css`padding: 4px 8px;`}>
            Drag a chat here to pin it
          </EuiText>
        ) : (
          pinned.map((c) => <ConversationRow key={c.id} conversation={c} isActive={c.id === activeId} />)
        )}
        <EuiSpacer size="m" />
        <SidebarSectionLabel>Chats</SidebarSectionLabel>
        {chats.length === 0 ? (
          <EuiText size="xs" color="subdued" css={css`padding: 4px 8px;`}>
            No matching results
          </EuiText>
        ) : (
          chats.map((c) => <ConversationRow key={c.id} conversation={c} isActive={c.id === activeId} />)
        )}
      </EuiFlexItem>
      <EuiHorizontalRule margin="none" />
      <EuiFlexItem grow={false} css={css`padding: 8px;`}>
        <EuiButtonEmpty size="s" color="text" iconType="controls" flush="left" onClick={() => navigate('/agents/manage/agents')} data-test-subj="agentBuilderManageComponents" css={css`width: 100%; justify-content: flex-start;`}>
          Manage components
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const ManageSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { addToast } = useToasts();
  return (
    <EuiFlexGroup direction="column" gutterSize="none" responsive={false} className="eui-fullHeight" data-test-subj="agentBuilderSidebar-manage">
      <EuiFlexItem grow={false} css={css`padding: 12px 8px 4px;`}>
        <EuiButtonEmpty size="s" color="text" iconType="chevronSingleLeft" flush="left" onClick={() => navigate('/agents/conversations/new')}>
          Back
        </EuiButtonEmpty>
      </EuiFlexItem>
      <EuiHorizontalRule margin="s" />
      <EuiFlexItem grow css={css`padding: 0 8px;`}>
        <SidebarSectionLabel>Components</SidebarSectionLabel>
        {MANAGE_NAV_ITEMS.map((item) => {
          const href = `/agents/manage/${item.id}`;
          const active = pathname.startsWith(href);
          return (
            <EuiToolTip key={item.id} content={item.live ? undefined : `${item.label} — not part of this demo`} position="right">
              <EuiButtonEmpty
                size="s"
                color={active ? 'primary' : 'text'}
                iconType={item.icon}
                flush="left"
                isDisabled={!item.live}
                onClick={() => (item.live ? navigate(href) : addToast({ title: `${item.label} is not part of this demo`, color: 'primary' }))}
                css={css`
                  width: 100%;
                  justify-content: flex-start;
                  padding-left: 8px;
                  ${active ? 'background: rgba(0, 119, 204, 0.08);' : ''}
                `}
              >
                {item.label}
              </EuiButtonEmpty>
            </EuiToolTip>
          );
        })}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/* -------------------------------------------------------------- conversation */

const StepList: React.FC<{ steps: ToolCallStep[]; pendingCount?: number }> = ({ steps, pendingCount = 0 }) => {
  const { euiTheme } = useEuiTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div css={css`border-left: 2px solid ${euiTheme.colors.lightShade}; margin-left: 6px; padding-left: 14px;`}>
      {steps.map((step) => (
        <div key={step.id} css={css`padding: 3px 0;`}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="checkCircle" color="success" size="s" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiLink color="text" onClick={() => setExpanded(expanded === step.id ? null : step.id)}>
                <EuiText size="xs">{step.label}</EuiText>
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow" css={css`font-family: ${euiTheme.font.familyCode};`}>
                {step.tool}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">
                {(step.durationMs / 1000).toFixed(1)}s
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          {expanded === step.id && (
            <EuiText size="xs" color="subdued" css={css`padding: 4px 0 4px 24px;`}>
              {step.summary}
            </EuiText>
          )}
        </div>
      ))}
      {Array.from({ length: pendingCount }).map((_, i) => (
        <div key={`pending-${i}`} css={css`padding: 3px 0;`}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="s" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">
                {i === 0 ? 'Working…' : ''}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ))}
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message; agent: Agent }> = ({ message, agent }) => {
  const { euiTheme } = useEuiTheme();
  const { addToast } = useToasts();
  if (message.role === 'user') {
    return (
      <EuiFlexGroup justifyContent="flexEnd" responsive={false}>
        <EuiFlexItem grow={false} css={css`max-width: 75%;`}>
          <EuiPanel paddingSize="m" hasShadow={false} css={css`background: ${euiTheme.colors.backgroundBasePrimary}; border-radius: 16px 16px 4px 16px;`}>
            <EuiText size="s">{message.content}</EuiText>
          </EuiPanel>
          <EuiText size="xs" color="subdued" textAlign="right" css={css`padding: 4px 8px 0;`}>
            {formatRelative(message.createdAt)}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  return (
    <EuiFlexGroup gutterSize="m" responsive={false} alignItems="flexStart">
      <EuiFlexItem grow={false}>
        <AgentAvatar agent={agent} size="m" />
      </EuiFlexItem>
      <EuiFlexItem css={css`min-width: 0;`}>
        <EuiText size="xs" color="subdued">
          <strong>{agent.name}</strong> · {formatRelative(message.createdAt)}
        </EuiText>
        <EuiSpacer size="xs" />
        {message.steps && message.steps.length > 0 && (
          <>
            <StepList steps={message.steps} />
            <EuiSpacer size="s" />
          </>
        )}
        <EuiMarkdownFormat textSize="s">{message.content}</EuiMarkdownFormat>
        <EuiSpacer size="xs" />
        <EuiFlexGroup gutterSize="none" responsive={false}>
          <EuiToolTip content="Copy">
            <EuiButtonIcon iconType="copy" size="xs" color="text" aria-label="Copy" onClick={() => { navigator.clipboard?.writeText(message.content).catch(() => undefined); addToast({ title: 'Copied to clipboard', color: 'success', iconType: 'check' }); }} />
          </EuiToolTip>
          <EuiToolTip content="Good response">
            <EuiButtonIcon iconType="thumbUp" size="xs" color="text" aria-label="Good response" onClick={() => addToast({ title: 'Thanks for the feedback', color: 'success' })} />
          </EuiToolTip>
          <EuiToolTip content="Bad response">
            <EuiButtonIcon iconType="thumbDown" size="xs" color="text" aria-label="Bad response" onClick={() => addToast({ title: 'Thanks for the feedback', color: 'success' })} />
          </EuiToolTip>
          <EuiToolTip content="Regenerate">
            <EuiButtonIcon iconType="refresh" size="xs" color="text" aria-label="Regenerate" onClick={() => addToast({ title: 'Regenerate is not part of this demo', color: 'primary' })} />
          </EuiToolTip>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const ConversationInput: React.FC<{ onSend: (prompt: string) => void; disabled?: boolean; autoFocus?: boolean }> = ({ onSend, disabled, autoFocus }) => {
  const { euiTheme } = useEuiTheme();
  const { addToast } = useToasts();
  const [value, setValue] = useState('');
  const submit = () => {
    const prompt = value.trim();
    if (!prompt || disabled) return;
    onSend(prompt);
    setValue('');
  };
  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="s" css={css`border-radius: 12px; background: ${euiTheme.colors.emptyShade};`} data-test-subj="agentBuilderConversationInputForm">
      <EuiTextArea
        fullWidth
        resize="none"
        rows={2}
        placeholder="Ask anything"
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        aria-label="Message input"
        data-test-subj="agentBuilderConversationInput"
        css={css`
          border: none;
          box-shadow: none;
          background: transparent;
          &:focus {
            box-shadow: none;
            background: transparent;
          }
        `}
      />
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" responsive={false}>
            <EuiToolTip content="Attach">
              <EuiButtonIcon iconType="paperClip" color="text" aria-label="Attach" onClick={() => addToast({ title: 'Attachments are not part of this demo', color: 'primary' })} />
            </EuiToolTip>
            <EuiToolTip content="Commands">
              <EuiButtonIcon iconType="consoleApp" color="text" aria-label="Commands" onClick={() => addToast({ title: 'Slash commands are not part of this demo', color: 'primary' })} />
            </EuiToolTip>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow" iconType="sparkles">
                Elastic LLM
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="send" display="fill" color="primary" aria-label="Send" onClick={submit} isDisabled={!value.trim() || disabled} data-test-subj="agentBuilderConversationSend" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

const useTypewriter = (messages: string[], active: boolean) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  useEffect(() => {
    if (!active) return;
    const target = messages[index % messages.length];
    let i = 0;
    let timer: number;
    const type = () => {
      i += 1;
      setText(target.slice(0, i));
      if (i < target.length) timer = window.setTimeout(type, 28);
      else timer = window.setTimeout(() => setIndex((n) => n + 1), 1800);
    };
    timer = window.setTimeout(type, 200);
    return () => window.clearTimeout(timer);
  }, [index, messages, active]);
  return text;
};

const NewConversationPrompt: React.FC<{ agent: Agent; onSend: (prompt: string) => void }> = ({ agent, onSend }) => {
  const { euiTheme } = useEuiTheme();
  const typed = useTypewriter(CAPABILITY_MESSAGES, true);
  return (
    <EuiFlexGroup direction="column" justifyContent="center" alignItems="center" className="eui-fullHeight" gutterSize="none" responsive={false} data-test-subj="agentBuilderNewConversationPrompt">
      <EuiFlexItem grow={false} css={css`width: 100%; max-width: ${CONTENT_MAX_WIDTH}px;`}>
        <EuiFlexGroup direction="column" alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <AgentAvatar agent={agent} size="xl" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="l">
              <h1 css={css`font-weight: 500; text-align: center;`}>How can I help you?</h1>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} css={css`min-height: 28px;`}>
            <EuiText size="m" color="subdued" textAlign="center">
              {typed}
              <span css={css`display: inline-block; width: 2px; height: 1em; background: ${euiTheme.colors.textSubdued}; margin-left: 2px; vertical-align: text-bottom; animation: blink 1s steps(1) infinite; @keyframes blink { 50% { opacity: 0; } }`} />
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <ConversationInput onSend={onSend} autoFocus />
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" wrap justifyContent="center" responsive={false}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <EuiFlexItem grow={false} key={prompt}>
              <EuiButton size="s" color="text" onClick={() => onSend(prompt)} css={css`border-radius: 999px;`}>
                {prompt}
              </EuiButton>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const ConversationHeader: React.FC<{ title: string; agent: Agent }> = ({ title, agent }) => {
  const { euiTheme } = useEuiTheme();
  const { addToast } = useToasts();
  return (
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} css={css`padding: 10px 16px; border-bottom: ${euiTheme.border.thin};`} data-test-subj="agentBuilderConversationHeader">
      <EuiFlexItem grow={false} css={css`min-width: 0;`}>
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <AgentAvatar agent={agent} />
          </EuiFlexItem>
          <EuiFlexItem grow={false} css={css`min-width: 0;`}>
            <EuiTitle size="xxs">
              <h2 className="eui-textTruncate">{title}</h2>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="xs" responsive={false}>
          <EuiButtonEmpty size="s" iconType="share" color="text" onClick={() => addToast({ title: 'Link copied', color: 'success', iconType: 'check' })}>
            Share
          </EuiButtonEmpty>
          <EuiButtonIcon iconType="ellipsis" color="text" aria-label="Conversation actions" onClick={() => addToast({ title: 'Use the sidebar menu to pin, rename or delete', color: 'primary' })} />
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const ConversationView: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { agents, getConversation, sendMessage, pending, selectedAgentId, setSelectedAgentId, markRead } = useAgentBuilder();
  const isNew = !conversationId || conversationId === 'new';
  const conversation = isNew ? undefined : getConversation(conversationId);
  const agent = agents.find((a) => a.id === (conversation?.agentId ?? selectedAgentId)) ?? agents.find((a) => a.id === DEFAULT_AGENT_ID) ?? agents[0];
  const scrollRef = useRef<HTMLDivElement>(null);

  useBreadcrumbs(conversation ? [{ text: 'Agents', href: '/agents' }, { text: conversation.title }] : [{ text: 'Agents', href: '/agents' }, { text: 'New conversation' }]);

  useEffect(() => {
    if (conversation && conversation.agentId !== selectedAgentId) setSelectedAgentId(conversation.agentId);
    if (conversation?.unread) markRead(conversation.id);
  }, [conversation, selectedAgentId, setSelectedAgentId, markRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation?.messages.length, pending?.steps.length]);

  if (!isNew && !conversation) return <Navigate to="/agents/conversations/new" replace />;

  const send = (prompt: string) => {
    const id = sendMessage(conversation?.id, agent.id, prompt);
    if (!conversation) navigate(`/agents/conversations/${id}`, { replace: true });
  };

  if (!conversation) {
    return (
      <div css={css`height: 100%; padding: 24px;`}>
        <NewConversationPrompt agent={agent} onSend={send} />
      </div>
    );
  }

  const isPending = pending?.conversationId === conversation.id;

  return (
    <EuiFlexGroup direction="column" gutterSize="none" responsive={false} className="eui-fullHeight" data-test-subj="agentBuilderConversation">
      <EuiFlexItem grow={false}>
        <ConversationHeader title={conversation.title} agent={agent} />
      </EuiFlexItem>
      <EuiFlexItem grow css={css`overflow-y: auto;`}>
        <div ref={scrollRef} css={css`height: 100%; overflow-y: auto; padding: 24px 16px;`}>
          <div css={css`max-width: ${CONTENT_MAX_WIDTH}px; margin: 0 auto;`}>
            <EuiFlexGroup direction="column" gutterSize="l" responsive={false}>
              {conversation.messages.map((message) => (
                <EuiFlexItem key={message.id} grow={false}>
                  <MessageBubble message={message} agent={agent} />
                </EuiFlexItem>
              ))}
              {isPending && pending && (
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="m" responsive={false} alignItems="flexStart">
                    <EuiFlexItem grow={false}>
                      <AgentAvatar agent={agent} size="m" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="xs" color="subdued">
                        <strong>{agent.name}</strong> · In progress
                      </EuiText>
                      <EuiSpacer size="xs" />
                      <StepList steps={pending.steps} pendingCount={Math.max(1, pending.totalSteps - pending.steps.length)} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </div>
        </div>
      </EuiFlexItem>
      <EuiFlexItem grow={false} css={css`padding: 8px 16px 16px;`}>
        <div css={css`max-width: ${CONTENT_MAX_WIDTH}px; margin: 0 auto; width: 100%;`}>
          <ConversationInput onSend={send} disabled={isPending} />
          <EuiText size="xs" color="subdued" textAlign="center" css={css`padding-top: 6px;`}>
            Responses are canned demo data — the agent is not connected to a model.
          </EuiText>
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/* ------------------------------------------------------------------- agents */

const AccessBadge: React.FC<{ access: Agent['access'] }> = ({ access }) => (
  <EuiBadge color={access === 'Private' ? 'default' : access === 'Shared' ? 'primary' : 'hollow'} iconType={access === 'Private' ? 'lock' : access === 'Shared' ? 'users' : 'spaces'}>
    {access}
  </EuiBadge>
);

const AgentsListPage: React.FC = () => {
  useBreadcrumbs([{ text: 'Agents', href: '/agents' }, { text: 'Manage' }, { text: 'Agents' }]);
  const navigate = useNavigate();
  const { euiTheme } = useEuiTheme();
  const { agents, cloneAgent, deleteAgent, setSelectedAgentId } = useAgentBuilder();
  const { addToast } = useToasts();
  const [search, setSearch] = useState('');
  const rows = agents.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.labels.some((l) => l.includes(search.toLowerCase())));

  const columns: Array<EuiBasicTableColumn<Agent>> = [
    {
      field: 'name',
      name: 'Name',
      width: '33%',
      render: (_: string, agent: Agent) => (
        <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={false}>
          <EuiFlexItem grow={false}>
            <AgentAvatar agent={agent} size="m" />
          </EuiFlexItem>
          <EuiFlexItem css={css`min-width: 0;`}>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
              <EuiFlexItem grow={false}>
                <EuiLink onClick={() => navigate(`/agents/manage/agents/${agent.id}`)} data-test-subj={`agentLink-${agent.id}`}>
                  <strong css={css`white-space: nowrap;`}>{agent.name}</strong>
                </EuiLink>
              </EuiFlexItem>
              {agent.isSpaceDefault && (
                <EuiFlexItem grow={false}>
                  <EuiBadge color="hollow">Space default</EuiBadge>
                </EuiFlexItem>
              )}
              {agent.type === 'Elastic' && (
                <EuiFlexItem grow={false}>
                  <EuiBadge color="hollow" iconType="logoElastic">
                    Preconfigured
                  </EuiBadge>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
            <EuiText size="xs" color="subdued" css={css`display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`}>
              {agent.description}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    { field: 'access', name: 'Access', width: '10%', render: (access: Agent['access']) => <AccessBadge access={access} /> },
    {
      field: 'labels',
      name: 'Labels',
      width: '20%',
      render: (labels: string[]) => (
        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
          {labels.map((l) => (
            <EuiFlexItem grow={false} key={l}>
              <EuiBadge color="hollow">{l}</EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ),
    },
    { field: 'createdBy', name: 'Created by', width: '12%' },
    {
      field: 'updatedBy',
      name: 'Last updated by',
      width: '15%',
      render: (updatedBy: string, agent: Agent) => (
        <div>
          <EuiText size="s">{updatedBy}</EuiText>
          <EuiText size="xs" color="subdued">
            {formatRelative(agent.updatedAt)}
          </EuiText>
        </div>
      ),
    },
    {
      name: 'Actions',
      width: '10%',
      actions: [
        {
          name: 'Chat',
          description: 'Chat with agent',
          icon: 'comment',
          type: 'icon',
          onClick: (agent: Agent) => {
            setSelectedAgentId(agent.id);
            navigate('/agents/conversations/new');
          },
        },
        {
          name: 'Edit',
          description: 'Edit agent',
          icon: 'pencil',
          type: 'icon',
          enabled: (agent: Agent) => !agent.readonly,
          onClick: (agent: Agent) => navigate(`/agents/manage/agents/${agent.id}`),
        },
        {
          name: 'Clone',
          description: 'Clone agent',
          icon: 'copy',
          type: 'icon',
          onClick: (agent: Agent) => {
            const clone = cloneAgent(agent.id);
            if (clone) addToast({ title: `Cloned "${agent.name}"`, color: 'success', iconType: 'check' });
          },
        },
        {
          name: 'Delete',
          description: 'Delete agent',
          icon: 'trash',
          type: 'icon',
          color: 'danger',
          enabled: (agent: Agent) => !agent.readonly,
          onClick: (agent: Agent) => {
            deleteAgent(agent.id);
            addToast({ title: `Deleted "${agent.name}"`, color: 'success', iconType: 'check' });
          },
        },
      ],
    },
  ];

  return (
    <div css={css`padding: 24px 32px; max-width: 1400px;`} data-test-subj="agentBuilderAgentsList">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="l">
            <h1>Agents</h1>
          </EuiTitle>
          <EuiText size="s" color="subdued">
            Agents combine an LLM, instructions, tools and skills. Chat with one, or create your own.{' '}
            <EuiLink href="https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder" target="_blank" external>
              Learn more
            </EuiLink>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton fill iconType="plus" onClick={() => addToast({ title: 'Creating agents is not part of this demo — try Clone instead', color: 'primary' })} data-test-subj="agentBuilderNewAgentButton">
            New agent
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      <EuiPanel hasBorder hasShadow={false} paddingSize="m" css={css`background: ${euiTheme.colors.emptyShade};`}>
        <EuiFieldSearch fullWidth placeholder="Search agents" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search agents" />
        <EuiSpacer size="m" />
        <EuiInMemoryTable items={rows} columns={columns} tableLayout="fixed" rowHeader="name" responsiveBreakpoint={false} />
      </EuiPanel>
    </div>
  );
};

const AgentOverviewPage: React.FC = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { euiTheme } = useEuiTheme();
  const { agents, setSelectedAgentId } = useAgentBuilder();
  const { addToast } = useToasts();
  const agent = agents.find((a) => a.id === agentId);
  const [tab, setTab] = useState<'overview' | 'tools' | 'skills' | 'subagents'>('overview');
  useBreadcrumbs([{ text: 'Agents', href: '/agents' }, { text: 'Manage' }, { text: 'Agents', href: '/agents/manage/agents' }, { text: agent?.name ?? 'Agent' }]);

  if (!agent) return <Navigate to="/agents/manage/agents" replace />;

  return (
    <div css={css`padding: 24px 32px; max-width: 1200px;`} data-test-subj="agentBuilderAgentOverview">
      <EuiButtonEmpty size="s" iconType="chevronSingleLeft" flush="left" onClick={() => navigate('/agents/manage/agents')}>
        Agents
      </EuiButtonEmpty>
      <EuiSpacer size="s" />
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
            <EuiFlexItem grow={false}>
              <AgentAvatar agent={agent} size="xl" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                <EuiTitle size="l">
                  <h1>{agent.name}</h1>
                </EuiTitle>
                {agent.isSpaceDefault && <EuiBadge color="hollow">Space default</EuiBadge>}
                <AccessBadge access={agent.access} />
              </EuiFlexGroup>
              <EuiText size="s" color="subdued">
                {agent.description}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiButton
              iconType="comment"
              fill
              onClick={() => {
                setSelectedAgentId(agent.id);
                navigate('/agents/conversations/new');
              }}
            >
              Chat
            </EuiButton>
            <EuiToolTip content={agent.readonly ? 'Built-in agents are read-only.' : undefined}>
              <EuiButton iconType="pencil" isDisabled={agent.readonly} onClick={() => addToast({ title: 'Editing agents is not part of this demo', color: 'primary' })}>
                Edit
              </EuiButton>
            </EuiToolTip>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      {agent.readonly && <EuiCallOut size="s" iconType="lock" title="Built-in agents are read-only. Clone this agent to customize its instructions, tools and skills." />}
      <EuiSpacer size="m" />
      <EuiTabs size="s">
        {(['overview', 'tools', 'skills', 'subagents'] as const).map((id) => (
          <EuiTab key={id} isSelected={tab === id} onClick={() => setTab(id)}>
            {id === 'overview' ? 'Overview' : id === 'tools' ? `Tools (${agent.tools.length})` : id === 'skills' ? `Skills (${agent.skills.length})` : 'Subagents'}
          </EuiTab>
        ))}
      </EuiTabs>
      <EuiSpacer size="m" />
      {tab === 'overview' && (
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem grow={2}>
            <EuiPanel hasBorder hasShadow={false}>
              <EuiTitle size="xs">
                <h3>Instructions</h3>
              </EuiTitle>
              <EuiSpacer size="s" />
              <EuiCodeBlock language="markdown" fontSize="s" paddingSize="m" whiteSpace="pre-wrap" isCopyable>
                {agent.instructions}
              </EuiCodeBlock>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiPanel hasBorder hasShadow={false}>
              <EuiTitle size="xs">
                <h3>Details</h3>
              </EuiTitle>
              <EuiSpacer size="s" />
              <EuiText size="s">
                <dl css={css`display: grid; grid-template-columns: 120px 1fr; row-gap: 6px; dt { color: ${euiTheme.colors.textSubdued}; } dd { margin: 0; }`}>
                  <dt>ID</dt>
                  <dd>
                    <code>{agent.id}</code>
                  </dd>
                  <dt>Type</dt>
                  <dd>{agent.type}</dd>
                  <dt>Labels</dt>
                  <dd>{agent.labels.join(', ')}</dd>
                  <dt>Created by</dt>
                  <dd>
                    {agent.createdBy} · {formatDate(agent.createdAt)}
                  </dd>
                  <dt>Updated by</dt>
                  <dd>
                    {agent.updatedBy} · {formatDate(agent.updatedAt)}
                  </dd>
                  <dt>Model</dt>
                  <dd>Elastic LLM (default)</dd>
                </dl>
              </EuiText>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      {tab === 'tools' && (
        <EuiPanel hasBorder hasShadow={false}>
          <EuiInMemoryTable
            items={agent.tools.map((t) => ({ id: t, type: t.startsWith('platform.core') ? 'Built-in' : 'Security', description: `Tool ${t.split('.').slice(-1)[0].replace(/_/g, ' ')}` }))}
            columns={[
              { field: 'id', name: 'Tool', render: (id: string) => <code>{id}</code> },
              { field: 'type', name: 'Type', width: '120px', render: (t: string) => <EuiBadge color="hollow">{t}</EuiBadge> },
              { field: 'description', name: 'Description' },
            ]}
            compressed
          />
        </EuiPanel>
      )}
      {tab === 'skills' && (
        <EuiFlexGroup gutterSize="m" wrap>
          {agent.skills.map((skill) => (
            <EuiFlexItem key={skill} grow={false} css={css`min-width: 260px;`}>
              <EuiPanel hasBorder hasShadow={false}>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                  <EuiIcon type="sparkles" />
                  <EuiTitle size="xs">
                    <h4>{skill}</h4>
                  </EuiTitle>
                </EuiFlexGroup>
                <EuiSpacer size="xs" />
                <EuiText size="xs" color="subdued">
                  Reusable skill package attached to this agent.
                </EuiText>
              </EuiPanel>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      )}
      {tab === 'subagents' && (
        <EuiPanel hasBorder hasShadow={false}>
          <EuiText size="s" color="subdued">
            Subagents are disabled for this agent. Enable subagents to let it delegate to other agents (not part of this demo).
          </EuiText>
        </EuiPanel>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------------- app */

const Layout: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const { pathname } = useLocation();
  const isManage = pathname.startsWith('/agents/manage');
  return (
    <div
      css={css`
        display: flex;
        height: var(--kbn-application--content-height);
        min-height: 0;
        background: ${euiTheme.colors.backgroundBasePlain};
      `}
      data-test-subj="agentBuilderApp"
    >
      <aside
        css={css`
          width: ${SIDEBAR_WIDTH}px;
          flex: 0 0 ${SIDEBAR_WIDTH}px;
          border-right: ${euiTheme.border.thin};
          background: ${euiTheme.colors.body};
          min-height: 0;
        `}
      >
        {isManage ? <ManageSidebar /> : <ConversationSidebar />}
      </aside>
      <section
        css={css`
          flex: 1;
          min-width: 0;
          min-height: 0;
          overflow: auto;
        `}
      >
        <Routes>
          <Route index element={<Navigate to="conversations/new" replace />} />
          <Route path="conversations/:conversationId" element={<ConversationView />} />
          <Route path="manage" element={<Navigate to="agents" replace />} />
          <Route path="manage/agents" element={<AgentsListPage />} />
          <Route path="manage/agents/:agentId" element={<AgentOverviewPage />} />
          <Route path="*" element={<Navigate to="conversations/new" replace />} />
        </Routes>
      </section>
    </div>
  );
};

export const AgentBuilderApp: React.FC = () => <Layout />;
