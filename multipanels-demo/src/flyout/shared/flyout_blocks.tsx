import React from 'react';
import { css } from '@emotion/react';
import {
  EuiAccordion,
  EuiBadge,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  useGeneratedHtmlId,
} from '@elastic/eui';

/** Small bordered tile used in the alert header (Status, Risk score, Assignees, Notes). */
export const FlyoutHeaderBlock: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
  'data-test-subj'?: string;
}> = ({ title, children, ...rest }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiPanel
      hasShadow={false}
      hasBorder
      paddingSize="s"
      css={css`
        height: 100%;
      `}
      {...rest}
    >
      <EuiText
        size="xs"
        css={css`
          color: ${euiTheme.colors.textSubdued};
          font-weight: ${euiTheme.font.weight.semiBold};
          margin-bottom: ${euiTheme.size.xs};
        `}
      >
        {title}
      </EuiText>
      <div
        css={css`
          display: flex;
          align-items: center;
          min-height: 24px;
        `}
      >
        {children}
      </div>
    </EuiPanel>
  );
};

/** Collapsible section in the Overview tab (About, Investigation, Visualizations, Insights, Response). */
export const ExpandableSection: React.FC<{
  title: string;
  initialIsOpen?: boolean;
  children: React.ReactNode;
  /** Optional action rendered on the right of the title, e.g. an "open in left panel" icon. */
  extraAction?: React.ReactNode;
  'data-test-subj'?: string;
}> = ({ title, initialIsOpen = true, children, extraAction, ...rest }) => {
  const id = useGeneratedHtmlId({ prefix: 'flyoutSection' });
  return (
    <EuiAccordion
      id={id}
      initialIsOpen={initialIsOpen}
      buttonContent={
        <EuiTitle size="xs">
          <h4>{title}</h4>
        </EuiTitle>
      }
      extraAction={extraAction}
      paddingSize="s"
      {...rest}
    >
      {children}
    </EuiAccordion>
  );
};

/** One "N related alerts" style summary row that deep-links into the left panel. */
export const InsightsSummaryRow: React.FC<{
  icon?: string;
  text: React.ReactNode;
  count?: number;
  color?: string;
  onClick?: () => void;
  'data-test-subj'?: string;
}> = ({ icon, text, count, color = 'hollow', onClick, ...rest }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGroup
      alignItems="center"
      gutterSize="s"
      responsive={false}
      css={css`
        padding: ${euiTheme.size.xs} 0;
      `}
      {...rest}
    >
      {icon && (
        <EuiFlexItem grow={false}>
          <EuiButtonIcon iconType={icon} color="text" size="xs" aria-hidden display="empty" tabIndex={-1} />
        </EuiFlexItem>
      )}
      <EuiFlexItem>
        <EuiText size="s">{onClick ? <EuiLink onClick={onClick}>{text}</EuiLink> : text}</EuiText>
      </EuiFlexItem>
      {count !== undefined && (
        <EuiFlexItem grow={false}>
          <EuiBadge color={color}>{count}</EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

/** Title + "open in left panel" icon used by the Overview sections. */
export const SectionTitleAction: React.FC<{ tooltip: string; onClick: () => void; 'data-test-subj'?: string }> = ({
  tooltip,
  onClick,
  ...rest
}) => (
  <EuiToolTip content={tooltip}>
    <EuiButtonIcon iconType="chevronLimitLeft" aria-label={tooltip} color="text" size="xs" onClick={onClick} {...rest} />
  </EuiToolTip>
);

/** Key/value grid used by About / entity overviews. */
export const KeyValueList: React.FC<{ items: Array<{ label: string; value: React.ReactNode }> }> = ({ items }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: minmax(120px, 160px) 1fr;
        row-gap: ${euiTheme.size.xs};
        column-gap: ${euiTheme.size.m};
        align-items: start;
      `}
    >
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <EuiText size="xs" color="subdued">
            {item.label}
          </EuiText>
          <EuiText size="xs" className="eui-textBreakWord">
            {item.value}
          </EuiText>
        </React.Fragment>
      ))}
    </div>
  );
};
