import React, { useMemo, useState } from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { useBreadcrumbs } from '../../chrome/chrome_context';
import { SecurityPageWrapper } from '../../components/page_wrapper';
import { AssigneeAvatars, SeverityFilledBadge, formatDate, formatRelative } from '../../components/formatters';
import { Sparkline } from '../../components/charts';
import { useToasts } from '../../components/toasts';
import {
  PROPOSALS,
  QUEUE_COLORS,
  QUEUE_LABELS,
  TREND_PANELS,
  TREND_SERIES,
  WATCHES,
  impactPills,
  type Proposal,
  type QueueCategory,
} from '../../data/alertzero';
import { useAlertsState } from '../../state/alerts_state';
import { useFlyoutApi } from '../../flyout/flyout_context';

const ENTITY_ICON: Record<Proposal['entities'][number]['type'], string> = {
  host: 'storage',
  user: 'user',
  ip: 'globe',
  rule: 'securityAnalyticsApp',
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
};

/* ------------------------------------------------------------------- header */

const AlertZeroHeader: React.FC<{ needsAction: number }> = ({ needsAction }) => {
  const { euiTheme } = useEuiTheme();
  const { addToast } = useToasts();
  return (
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} data-test-subj="alertZeroPageHeader">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
          <EuiFlexItem grow={false}>
            <div
              role="img"
              aria-label="AlertZero"
              css={css`
                align-items: center;
                border: 1px solid ${euiTheme.colors.lightShade};
                border-radius: 50%;
                color: ${euiTheme.colors.primary};
                display: inline-flex;
                height: 48px;
                width: 48px;
                justify-content: center;
                position: relative;
                background: ${euiTheme.colors.emptyShade};
              `}
            >
              <EuiIcon type="sun" size="m" />
              <span
                css={css`
                  display: inline-block;
                  background: ${euiTheme.colors.danger};
                  width: ${euiTheme.size.s};
                  height: ${euiTheme.size.s};
                  border-radius: 50%;
                  box-shadow: 0 0 0 2px ${euiTheme.colors.emptyShade};
                  position: absolute;
                  top: 1px;
                  right: 1px;
                `}
              />
            </div>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="m" css={{ fontWeight: 500 }}>
              <h1>
                <span css={css`color: ${euiTheme.colors.textSubdued}; font-weight: 400;`}>{greeting()} </span>
                {needsAction === 0 ? "You're all caught up" : `${needsAction} actions need you`}
              </h1>
            </EuiTitle>
            <EuiText size="s" color="subdued">
              Your Watches are running.
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiPanel hasBorder hasShadow={false} paddingSize="s" css={css`min-width: 260px;`} data-test-subj="workersRunningPanel">
              <EuiText size="xs" color="subdued">
                <strong>{WATCHES.filter((w) => w.enabled > 0).length} Watches</strong> · {WATCHES.reduce((n, w) => n + w.enabled, 0)} Workers running
              </EuiText>
              <EuiSpacer size="xs" />
              <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                {WATCHES.map((watch) => (
                  <EuiFlexItem grow={false} key={watch.id}>
                    <EuiBadge color={watch.enabled > 0 ? 'hollow' : 'default'} iconType={watch.enabled > 0 ? 'checkCircle' : 'pause'}>
                      {watch.name} ({watch.enabled}/{watch.workers.length})
                    </EuiBadge>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Watches — not part of this demo">
              <EuiButtonEmpty size="s" iconType="eye" onClick={() => addToast({ title: 'Watches settings are not part of this demo', color: 'primary' })}>
                Watches
              </EuiButtonEmpty>
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/* -------------------------------------------------------------------- trend */

const TrendRow: React.FC<{ proposals: Proposal[] }> = ({ proposals }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGroup gutterSize="m" responsive={false} data-test-subj="proposalsTrendChartRow">
      {TREND_PANELS.map((panel) => {
        const count = proposals.filter((p) => p.category === panel.id).length;
        return (
          <EuiFlexItem key={panel.id}>
            <EuiPanel hasBorder hasShadow={false} paddingSize="m">
              <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    {panel.label}
                  </EuiText>
                  <EuiTitle size="l">
                    <span css={css`color: ${panel.color}; font-weight: ${euiTheme.font.weight.semiBold};`}>{count}</span>
                  </EuiTitle>
                  <EuiText size="xs" color="subdued">
                    {count} open proposals over the last 24 hours
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <Sparkline values={TREND_SERIES[panel.id]} color={panel.color} />
                  <EuiFlexGroup justifyContent="spaceBetween" responsive={false} gutterSize="none">
                    <EuiText size="xs" color="subdued">24h ago</EuiText>
                    <EuiText size="xs" color="subdued">Now</EuiText>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};

/* ------------------------------------------------------------------- impact */

const ImpactPills: React.FC<{ proposals: Proposal[]; selected: string | null; onSelect: (id: string | null) => void }> = ({ proposals, selected, onSelect }) => {
  const pills = impactPills(proposals).slice(0, 10);
  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" wrap responsive={false} data-test-subj="impactFilters">
      <EuiFlexItem grow={false}>
        <EuiText size="xs" color="subdued">
          <strong>Impact</strong>
        </EuiText>
      </EuiFlexItem>
      {pills.map((pill) => (
        <EuiFlexItem grow={false} key={pill.id}>
          <EuiBadge
            color={selected === pill.id ? 'primary' : 'hollow'}
            iconType={ENTITY_ICON[pill.type]}
            onClick={() => onSelect(selected === pill.id ? null : pill.id)}
            onClickAriaLabel={`Filter by ${pill.id}`}
          >
            {pill.id} · {pill.count}
          </EuiBadge>
        </EuiFlexItem>
      ))}
      {selected && (
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="xs" onClick={() => onSelect(null)}>
            Clear
          </EuiButtonEmpty>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

/* -------------------------------------------------------------------- cards */

const ProposalActions: React.FC<{ proposal: Proposal; onOpenChat: () => void; onDecide: (outcome: 'Approved' | 'Dismissed') => void }> = ({ proposal, onOpenChat, onDecide }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { addToast } = useToasts();
  return (
    <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false} onClick={(e) => e.stopPropagation()}>
      <EuiFlexItem grow={false}>
        <EuiButton size="s" color={proposal.category === 'respond' ? 'danger' : 'primary'} onClick={() => onDecide('Approved')} data-test-subj="recommendedActionButton">
          {proposal.recommendedAction}
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiToolTip content="Open chat">
          <EuiButtonIcon iconType="comment" aria-label="Open chat" color="text" onClick={onOpenChat} />
        </EuiToolTip>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPopover
          button={<EuiButtonIcon iconType="ellipsis" aria-label="More actions" color="text" onClick={() => setMenuOpen((o) => !o)} />}
          isOpen={menuOpen}
          closePopover={() => setMenuOpen(false)}
          panelPaddingSize="none"
          anchorPosition="downRight"
        >
          <EuiContextMenuPanel
            items={[
              <EuiContextMenuItem key="dismiss" icon="cross" onClick={() => { setMenuOpen(false); onDecide('Dismissed'); }}>Dismiss</EuiContextMenuItem>,
              <EuiContextMenuItem key="escalate" icon="flag" onClick={() => { setMenuOpen(false); addToast({ title: 'Escalations are not part of this demo', color: 'primary' }); }}>Escalate</EuiContextMenuItem>,
              <EuiContextMenuItem key="copy" icon="link" onClick={() => { setMenuOpen(false); addToast({ title: 'Link copied', color: 'success', iconType: 'check' }); }}>Copy link</EuiContextMenuItem>,
            ]}
          />
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const ProposalCard: React.FC<{
  proposal: Proposal;
  isSelected: boolean;
  onClick: () => void;
  onOpenChat: () => void;
  onDecide: (outcome: 'Approved' | 'Dismissed') => void;
}> = ({ proposal, isSelected, onClick, onOpenChat, onDecide }) => {
  const { euiTheme } = useEuiTheme();
  const compact = proposal.category === 'closed';
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={proposal.title}
      aria-current={isSelected || undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-test-subj={`conversationCard-${proposal.id}`}
      css={css`
        padding: ${compact ? euiTheme.size.m : euiTheme.size.l} ${euiTheme.size.base} ${compact ? euiTheme.size.m : euiTheme.size.l} ${euiTheme.size.l};
        cursor: pointer;
        border-bottom: 1px solid ${euiTheme.colors.lightShade};
        background: ${isSelected ? euiTheme.colors.backgroundBaseInteractiveSelect : 'transparent'};
        &:last-child {
          border-bottom: none;
        }
        &:hover {
          background: ${isSelected ? euiTheme.colors.backgroundBaseInteractiveSelect : euiTheme.colors.backgroundBaseSubdued};
        }
      `}
    >
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="l" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">
                {formatRelative(proposal.createdAt)}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">
                · {proposal.watch} › {proposal.worker}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">{Math.round(proposal.confidence * 100)}% confidence</EuiBadge>
            </EuiFlexItem>
            {compact && proposal.outcome && (
              <EuiFlexItem grow={false}>
                <EuiBadge color={proposal.outcome === 'Dismissed' ? 'default' : 'success'}>{proposal.outcome}</EuiBadge>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
        {!compact && (
          <EuiFlexItem grow={false}>
            <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
              <EuiFlexItem grow={false}>
                <AssigneeAvatars assignees={proposal.assignees} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <ProposalActions proposal={proposal} onOpenChat={onOpenChat} onDecide={onDecide} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      <EuiTitle size="xxs">
        <h4 css={css`font-weight: ${euiTheme.font.weight.semiBold};`}>{proposal.title}</h4>
      </EuiTitle>
      {!compact && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">
            {proposal.summary}
          </EuiText>
          <EuiSpacer size="s" />
          <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
            {proposal.entities.map((entity) => (
              <EuiFlexItem grow={false} key={entity.id}>
                <EuiBadge color="hollow" iconType={ENTITY_ICON[entity.type]}>
                  {entity.id}
                </EuiBadge>
              </EuiFlexItem>
            ))}
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow" iconType="warning">
                {proposal.relatedAlertIds.length} alerts
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </div>
  );
};

const QueueSection: React.FC<{
  category: QueueCategory;
  proposals: Proposal[];
  initialIsOpen: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenChat: (proposal: Proposal) => void;
  onDecide: (proposal: Proposal, outcome: 'Approved' | 'Dismissed') => void;
}> = ({ category, proposals, initialIsOpen, selectedId, onSelect, onOpenChat, onDecide }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="none" data-test-subj={`conversationQueue-${category}`}>
      <EuiAccordion
        id={`queue-${category}`}
        initialIsOpen={initialIsOpen}
        arrowDisplay="right"
        buttonContent={
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xxs">
                <h3 css={css`font-weight: ${euiTheme.font.weight.semiBold};`}>{QUEUE_LABELS[category]}</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color={QUEUE_COLORS[category]}>{proposals.length}</EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        css={css`
          .euiAccordion__triggerWrapper {
            padding: ${euiTheme.size.m} ${euiTheme.size.l} ${euiTheme.size.m} ${euiTheme.size.m};
          }
          &.euiAccordion-isOpen .euiAccordion__triggerWrapper {
            border-bottom: 1px solid ${euiTheme.colors.lightShade};
          }
        `}
      >
        {proposals.length === 0 ? (
          <EuiPanel hasBorder={false} hasShadow={false}>
            <EuiText size="xs" color="subdued">
              Proposals land here as each Worker finishes. Nothing needs you right now.
            </EuiText>
          </EuiPanel>
        ) : (
          proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isSelected={selectedId === proposal.id}
              onClick={() => onSelect(proposal.id)}
              onOpenChat={() => onOpenChat(proposal)}
              onDecide={(outcome) => onDecide(proposal, outcome)}
            />
          ))
        )}
      </EuiAccordion>
    </EuiPanel>
  );
};

/* ------------------------------------------------------------ details flyout */

const ProposalFlyout: React.FC<{ proposal: Proposal; onClose: () => void; onOpenChat: () => void; onDecide: (outcome: 'Approved' | 'Dismissed') => void }> = ({ proposal, onClose, onOpenChat, onDecide }) => {
  const { euiTheme } = useEuiTheme();
  const navigate = useNavigate();
  const { getAlert } = useAlertsState();
  const { openRightPanel } = useFlyoutApi();
  const alerts = proposal.relatedAlertIds.map((id) => getAlert(id)).filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <EuiFlyout onClose={onClose} size="m" ownFocus={false} aria-label="Investigation details" data-test-subj="investigationDetailsFlyout" paddingSize="l">
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiBadge color={QUEUE_COLORS[proposal.category]}>{QUEUE_LABELS[proposal.category]}</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <SeverityFilledBadge severity={proposal.severity} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              {formatDate(proposal.createdAt)} · {proposal.watch} › {proposal.worker}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiTitle size="s">
          <h2>{proposal.title}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiTitle size="xs">
          <h3>Summary</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s">{proposal.summary}</EuiText>
        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>What happened</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s">
          <ol css={css`margin: 0; padding-left: ${euiTheme.size.l};`}>
            {proposal.whatHappened.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </EuiText>
        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>Entities</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
          {proposal.entities.map((entity) => (
            <EuiFlexItem grow={false} key={entity.id}>
              <EuiBadge color="hollow" iconType={ENTITY_ICON[entity.type]}>
                {entity.id}
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>Evidence · {alerts.length} alerts</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        {alerts.length === 0 ? (
          <EuiText size="s" color="subdued">
            This proposal is not backed by alerts.
          </EuiText>
        ) : (
          <EuiFlexGroup direction="column" gutterSize="s">
            {alerts.map((alert) => (
              <EuiFlexItem key={alert.id}>
                <EuiPanel hasBorder hasShadow={false} paddingSize="s">
                  <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <SeverityFilledBadge severity={alert.severity} />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiLink
                        onClick={() => {
                          onClose();
                          navigate('/alerts');
                          openRightPanel(alert.id);
                        }}
                      >
                        {alert.rule.name}
                      </EuiLink>
                      <EuiText size="xs" color="subdued">
                        {formatDate(alert.timestamp)} · {alert.host.name} · {alert.user.name}
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip content="Open alert details">
                        <EuiButtonIcon
                          iconType="maximize"
                          aria-label="Open alert details"
                          color="text"
                          onClick={() => {
                            onClose();
                            navigate('/alerts');
                            openRightPanel(alert.id);
                          }}
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        )}
        <EuiHorizontalRule margin="l" />
        <EuiText size="xs" color="subdued">
          Confidence {Math.round(proposal.confidence * 100)}% · Recommended action: <strong>{proposal.recommendedAction}</strong>
          {proposal.outcome ? ` · ${proposal.outcome}` : ''}
        </EuiText>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="comment" onClick={onOpenChat}>
              Open chat
            </EuiButtonEmpty>
          </EuiFlexItem>
          {proposal.category !== 'closed' && (
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty color="text" onClick={() => onDecide('Dismissed')}>
                    Dismiss
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton fill color={proposal.category === 'respond' ? 'danger' : 'primary'} onClick={() => onDecide('Approved')}>
                    {proposal.recommendedAction}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

/* --------------------------------------------------------------------- page */

export const AlertZeroPage: React.FC = () => {
  useBreadcrumbs([{ text: 'AlertZero', href: '/alertzero' }]);
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [proposals, setProposals] = useState<Proposal[]>(PROPOSALS);
  const [entityFilter, setEntityFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => (entityFilter ? proposals.filter((p) => p.entities.some((e) => e.id === entityFilter)) : proposals), [proposals, entityFilter]);
  const needsAction = proposals.filter((p) => p.category !== 'closed').length;
  const selected = proposals.find((p) => p.id === selectedId) ?? null;

  const openChat = (proposal: Proposal) => {
    navigate(proposal.conversationId ? `/agents/conversations/${proposal.conversationId}` : '/agents/conversations/new');
  };

  const decide = (proposal: Proposal, outcome: 'Approved' | 'Dismissed') => {
    setProposals((prev) => prev.map((p) => (p.id === proposal.id ? { ...p, category: 'closed', outcome } : p)));
    setSelectedId(null);
    addToast({
      title: outcome === 'Approved' ? `${proposal.recommendedAction} — approved` : 'Proposal dismissed',
      text: outcome === 'Approved' ? `The ${proposal.worker} worker will run "${proposal.recommendedAction}" (demo — nothing actually happens).` : undefined,
      color: outcome === 'Approved' ? 'success' : 'primary',
      iconType: outcome === 'Approved' ? 'check' : 'cross',
    });
  };

  return (
    <SecurityPageWrapper data-test-subj="alertZeroPage">
      <EuiSpacer size="l" />
      <AlertZeroHeader needsAction={needsAction} />
      <EuiSpacer size="l" />
      <TrendRow proposals={proposals} />
      <EuiSpacer size="m" />
      <ImpactPills proposals={proposals} selected={entityFilter} onSelect={setEntityFilter} />
      <EuiSpacer size="m" />
      <EuiFlexGroup direction="column" gutterSize="m">
        {(['respond', 'investigate', 'configure', 'closed'] as QueueCategory[]).map((category) => (
          <EuiFlexItem key={category}>
            <QueueSection
              category={category}
              proposals={visible.filter((p) => p.category === category)}
              initialIsOpen={category !== 'closed'}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenChat={openChat}
              onDecide={decide}
            />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      {selected && <ProposalFlyout proposal={selected} onClose={() => setSelectedId(null)} onOpenChat={() => openChat(selected)} onDecide={(outcome) => decide(selected, outcome)} />}
    </SecurityPageWrapper>
  );
};
