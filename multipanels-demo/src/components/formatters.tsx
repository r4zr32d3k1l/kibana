import React from 'react';
import { EuiAvatar, EuiBadge, EuiFlexGroup, EuiFlexItem, EuiHealth, EuiToolTip } from '@elastic/eui';
import moment from 'moment';
import { SEVERITY_COLOR, SEVERITY_LABEL, USERS_DIRECTORY, type Severity } from '../data/alerts';

export const KIBANA_DATE_FORMAT = 'MMM D, YYYY @ HH:mm:ss.SSS';

export const formatDate = (iso: string): string => moment(iso).format(KIBANA_DATE_FORMAT);

export const formatRelative = (iso: string): string => moment(iso).fromNow();

export const SeverityBadge: React.FC<{ severity: Severity; size?: 'xs' | 's' }> = ({ severity }) => (
  <EuiHealth color={SEVERITY_COLOR[severity]} textSize="xs">
    {SEVERITY_LABEL[severity]}
  </EuiHealth>
);

export const SeverityFilledBadge: React.FC<{ severity: Severity }> = ({ severity }) => (
  <EuiBadge color={SEVERITY_COLOR[severity]} css={{ color: severity === 'medium' ? '#1a1c21' : '#fff' }}>
    {SEVERITY_LABEL[severity]}
  </EuiBadge>
);

const RISK_COLORS: Record<string, string> = {
  Unknown: '#A6B2C5',
  Low: '#54B399',
  Moderate: '#D6BF57',
  High: '#DA8B45',
  Critical: '#E7664C',
};

export const RiskLevelBadge: React.FC<{ level: string }> = ({ level }) => (
  <EuiHealth color={RISK_COLORS[level] ?? RISK_COLORS.Unknown} textSize="xs">
    {level}
  </EuiHealth>
);

export const StatusBadge: React.FC<{ status: 'open' | 'acknowledged' | 'closed' }> = ({ status }) => {
  const color = status === 'open' ? 'primary' : status === 'acknowledged' ? 'warning' : 'default';
  return <EuiBadge color={color}>{status}</EuiBadge>;
};

export const AssigneeAvatars: React.FC<{ assignees: string[]; size?: 's' | 'm' | 'l'; max?: number }> = ({
  assignees,
  size = 's',
  max = 3,
}) => {
  if (assignees.length === 0) return <span>—</span>;
  const shown = assignees.slice(0, max);
  const extra = assignees.length - shown.length;
  return (
    <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center" wrap={false}>
      {shown.map((uid) => {
        const user = USERS_DIRECTORY[uid];
        if (!user) return null;
        return (
          <EuiFlexItem grow={false} key={uid}>
            <EuiToolTip content={`${user.fullName} (${user.username})`}>
              <EuiAvatar name={user.fullName} initials={user.initials} color={user.color} size={size} />
            </EuiToolTip>
          </EuiFlexItem>
        );
      })}
      {extra > 0 && (
        <EuiFlexItem grow={false}>
          <EuiAvatar name={`+${extra}`} initials={`+${extra}`} color="#D3DAE6" size={size} />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

export const criticalityLabel = (value: string): string =>
  ({
    low_impact: 'Low impact',
    medium_impact: 'Medium impact',
    high_impact: 'High impact',
    extreme_impact: 'Extreme impact',
    unassigned: 'Unassigned',
  })[value] ?? value;
