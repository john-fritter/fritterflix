"use client";

import { useState, useTransition } from "react";
import { saveStarRating } from "./actions";

type Props = {
  movieId: string;
  field: "johnRating" | "airaRating";
  initialValue: number | null; // 1–10 stored value, null = unrated
  label: string;
};

export function StarRating({ movieId, field, initialValue, label }: Props) {
  const [saved, setSaved] = useState(initialValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const display = hovered ?? saved ?? 0;

  function handleClick(value: number) {
    const next = value === saved ? null : value;
    setSaved(next);
    startTransition(async () => {
      await saveStarRating(movieId, field, next);
    });
  }

  return (
    <div className="star-rating">
      <div className="star-label">{label}</div>
      <div
        className={`stars${isPending ? " pending" : ""}`}
        onMouseLeave={() => setHovered(null)}
        role="group"
        aria-label={`${label} rating`}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const half = i * 2 + 1;
          const full = i * 2 + 2;
          const fill = display >= full ? 2 : display >= half ? 1 : 0;
          return (
            <span key={i} className={`star star-${fill}`}>
              <button
                type="button"
                aria-label={`${(half / 2).toFixed(1)} stars`}
                className="star-btn left"
                onMouseEnter={() => setHovered(half)}
                onClick={() => handleClick(half)}
              />
              <button
                type="button"
                aria-label={`${(full / 2).toFixed(1)} stars`}
                className="star-btn right"
                onMouseEnter={() => setHovered(full)}
                onClick={() => handleClick(full)}
              />
            </span>
          );
        })}
      </div>
      {saved !== null && (
        <span className="star-value">{(saved / 2).toFixed(1)}</span>
      )}
    </div>
  );
}
