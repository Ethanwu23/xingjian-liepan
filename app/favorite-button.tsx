"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FavoriteButtonProps = {
  month: string;
  initialFavorite: boolean;
  isAuthenticated: boolean;
  signInPath: string;
  storageAvailable: boolean;
};

export function FavoriteButton({
  month,
  initialFavorite,
  isAuthenticated,
  signInPath,
  storageAvailable,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return <a className="favorite-button" href={signInPath}>☆ 登录后收藏</a>;
  }

  if (!storageAvailable) {
    return <button className="favorite-button" disabled>收藏暂不可用</button>;
  }

  async function toggleFavorite() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        favorite ? `/api/cpi/favorites?month=${encodeURIComponent(month)}` : "/api/cpi/favorites",
        favorite
          ? { method: "DELETE" }
          : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }) },
      );
      if (!response.ok) throw new Error("收藏操作失败，请稍后重试");
      setFavorite(!favorite);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "收藏操作失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="favorite-control">
      <button
        className={`favorite-button ${favorite ? "selected" : ""}`}
        type="button"
        aria-pressed={favorite}
        disabled={pending}
        onClick={toggleFavorite}
      >
        {favorite ? "★ 已收藏" : "☆ 收藏本期"}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </span>
  );
}
