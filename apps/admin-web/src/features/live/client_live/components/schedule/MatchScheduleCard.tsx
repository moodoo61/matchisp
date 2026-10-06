'use client';

import type { Ref } from 'react';
import type { PublicSportMatch } from '../../types';
import {
  formatGoalLine,
  formatMatchTime,
  goalsForSide,
  matchCenterLabel,
} from './matchScheduleUtils';

type Props = {
  match: PublicSportMatch;
  nearest: boolean;
  cardRef?: Ref<HTMLDivElement>;
  onSelectChannel?: (channelId: string) => void;
};

function TeamLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className="cl-schedule-logo" title={name} />
    );
  }
  return (
    <span className="cl-schedule-logo is-empty" aria-hidden>
      {name.slice(0, 1)}
    </span>
  );
}

export function MatchScheduleCard({
  match,
  nearest,
  cardRef,
  onSelectChannel,
}: Props) {
  const homeGoals = goalsForSide(match.goals, true);
  const awayGoals = goalsForSide(match.goals, false);
  const center = matchCenterLabel(match);
  const linkedChannels = match.channels?.length
    ? match.channels
    : match.channel
      ? [match.channel]
      : [];
  const unmatchedLabels = (match.channelLabels ?? []).filter(
    (label) =>
      !linkedChannels.some(
        (ch) => ch.label.trim().replace(/\s+/g, ' ') === label.trim().replace(/\s+/g, ' '),
      ),
  );

  return (
    <div
      ref={cardRef}
      className={nearest ? 'cl-schedule-card is-nearest' : 'cl-schedule-card'}
    >
      <div className="cl-schedule-card-main">
        <span className="cl-schedule-cell">
          <span className="cl-schedule-meta">{match.tournament}</span>
          <TeamLogo
            name={match.homeTeam.name}
            logoUrl={match.homeTeam.logoUrl}
          />
          <span className="cl-schedule-team-name">{match.homeTeam.name}</span>
          {homeGoals.length ? (
            <ul className="cl-schedule-goals">
              {homeGoals.map((goal, idx) => (
                <li key={`h-${idx}-${goal.minuteLabel}-${goal.player}`}>
                  {formatGoalLine(goal)}
                </li>
              ))}
            </ul>
          ) : null}
        </span>

        <span className="cl-schedule-cell cl-schedule-cell-mid">
          <span className="cl-schedule-status">
            {match.status?.trim() || '\u00a0'}
          </span>
          <span
            className={
              center === 'VS' ? 'cl-schedule-vs' : 'cl-schedule-vs is-score'
            }
          >
            {center}
          </span>
          <span className="cl-schedule-meta is-spacer" aria-hidden>
            &nbsp;
          </span>
        </span>

        <span className="cl-schedule-cell">
          <span className="cl-schedule-meta cl-schedule-time">
            {formatMatchTime(match.kickoffAt)}
          </span>
          <TeamLogo
            name={match.awayTeam.name}
            logoUrl={match.awayTeam.logoUrl}
          />
          <span className="cl-schedule-team-name">{match.awayTeam.name}</span>
          {awayGoals.length ? (
            <ul className="cl-schedule-goals">
              {awayGoals.map((goal, idx) => (
                <li key={`a-${idx}-${goal.minuteLabel}-${goal.player}`}>
                  {formatGoalLine(goal)}
                </li>
              ))}
            </ul>
          ) : null}
        </span>
      </div>

      <div className="cl-schedule-channels" aria-label="قنوات المباراة">
        {linkedChannels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className="cl-schedule-channel"
            onClick={() => onSelectChannel?.(channel.id)}
          >
            {channel.label}
          </button>
        ))}
        {unmatchedLabels.map((label) => (
          <span key={label} className="cl-schedule-channel is-unlinked">
            {label}
          </span>
        ))}
        {!linkedChannels.length && !unmatchedLabels.length ? (
          <span className="cl-schedule-channel is-unlinked">بدون قناة</span>
        ) : null}
      </div>
    </div>
  );
}
