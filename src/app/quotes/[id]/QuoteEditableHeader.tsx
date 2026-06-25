"use client";

import { useState } from "react";
import QuoteOwnerActions from "./QuoteOwnerActions";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

type Category = { id: string; name: string; slug: string };

type Props = {
  quoteId: string;
  initialTitle: string;
  initialPrivateNickname: string | null;
  initialCategoryId: string;
  initialCategoryName: string;
  initialTopCategoryName: string | null;
  initialSubcategoryName: string | null;
  initialSuburb: string | null;
  initialState: string | null;
  initialDescription: string | null;
  categoryEdited: boolean;
  locationEdited: boolean;
  initialStatus: "pending" | "accepted" | "rejected";
  categories: Category[];
};

type EditingField = "nickname" | "category" | "location" | "description" | null;

function AiBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ml-1.5 align-middle"
      style={{ backgroundColor: "#EBEBEB", color: "#888888" }}
      title="Auto-filled by AI — edit if needed"
    >
      AI
    </span>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center ml-1.5 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors align-middle"
      aria-label="Edit"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  );
}

const inputClass =
  "w-full bg-white border border-outline-variant rounded-[10px] px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all";

export default function QuoteEditableHeader({
  quoteId,
  initialTitle,
  initialPrivateNickname,
  initialCategoryId,
  initialCategoryName,
  initialTopCategoryName,
  initialSubcategoryName,
  initialSuburb,
  initialState,
  initialDescription,
  categoryEdited,
  locationEdited,
  initialStatus,
  categories,
}: Props) {
  const [editing, setEditing] = useState<EditingField>(null);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  // Optimistic display values
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [suburb, setSuburb] = useState(initialSuburb ?? "");
  const [stateVal, setStateVal] = useState(initialState ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [nickname, setNickname] = useState(initialPrivateNickname ?? "");
  const [categoryWasEdited, setCategoryWasEdited] = useState(categoryEdited);
  const [locationWasEdited, setLocationWasEdited] = useState(locationEdited);

  // Draft state while editing
  const [draftNickname, setDraftNickname] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftSuburb, setDraftSuburb] = useState("");
  const [draftState, setDraftState] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  function startEdit(field: EditingField) {
    setFieldError("");
    setEditing(field);
    if (field === "nickname") setDraftNickname(nickname);
    if (field === "category") setDraftCategoryId(categoryId);
    if (field === "location") { setDraftSuburb(suburb); setDraftState(stateVal); }
    if (field === "description") setDraftDescription(description);
  }

  function cancelEdit() {
    setEditing(null);
    setFieldError("");
  }

  async function saveField(field: EditingField) {
    if (!field) return;
    setFieldError("");
    setSaving(true);

    const body: Record<string, string> = {};
    if (field === "nickname") body.privateNickname = draftNickname.trim();
    if (field === "category") body.categoryId = draftCategoryId;
    if (field === "location") { body.suburb = draftSuburb.trim(); body.state = draftState; }
    if (field === "description") body.description = draftDescription.trim();

    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setFieldError(data.error ?? "Couldn't save. Try again.");
      return;
    }

    // Apply optimistic update
    if (field === "nickname") setNickname(draftNickname.trim());
    if (field === "category") {
      const cat = categories.find((c) => c.id === draftCategoryId);
      if (cat) { setCategoryId(cat.id); setCategoryName(cat.name); }
      setCategoryWasEdited(true);
    }
    if (field === "location") {
      setSuburb(draftSuburb.trim());
      setStateVal(draftState);
      setLocationWasEdited(true);
    }
    if (field === "description") setDescription(draftDescription.trim());

    setEditing(null);
  }

  const SaveCancel = ({ field }: { field: EditingField }) => (
    <div className="flex items-center gap-2 mt-1.5">
      <button
        type="button"
        onClick={() => saveField(field)}
        disabled={saving}
        className="px-3 py-1.5 bg-primary text-on-primary rounded-[8px] text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={cancelEdit}
        disabled={saving}
        className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
      >
        Cancel
      </button>
      {fieldError && (
        <p className="text-xs text-error font-medium ml-1">{fieldError}</p>
      )}
    </div>
  );

  const locationDisplay = [suburb, stateVal].filter(Boolean).join(", ");

  return (
    <header className="space-y-3">
      {/* Category + location */}
      <div className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
        {editing === "category" ? (
          <div className="space-y-1">
            <select
              value={draftCategoryId}
              onChange={(e) => setDraftCategoryId(e.target.value)}
              className="bg-white border border-outline-variant rounded-[10px] px-2 py-1 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none normal-case tracking-normal"
              autoFocus
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <SaveCancel field="category" />
          </div>
        ) : (
          <span>
            {initialTopCategoryName && initialSubcategoryName ? (
              <>
                {initialTopCategoryName}
                <span className="font-normal normal-case tracking-normal">
                  {" · "}
                  {initialSubcategoryName}
                </span>
              </>
            ) : (
              categoryName
            )}
            {!categoryWasEdited && <AiBadge />}
            {/* TODO: 1c.iv.c — wire up category editing */}
            <EditButton onClick={() => { /* no-op until 1c.iv.c */ }} />
          </span>
        )}

        {editing !== "category" && editing !== "location" && (
          <span className="font-normal normal-case tracking-normal">
            {locationDisplay ? (
              <>
                {" · "}
                {locationDisplay}
                {!locationWasEdited && <AiBadge />}
                <EditButton onClick={() => startEdit("location")} />
              </>
            ) : (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => startEdit("location")}
                  className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Add location
                </button>
              </>
            )}
          </span>
        )}

        {editing === "location" && (
          <div className="mt-1 space-y-1 normal-case tracking-normal font-normal">
            <div className="flex gap-2">
              <input
                type="text"
                value={draftSuburb}
                onChange={(e) => setDraftSuburb(e.target.value)}
                placeholder="Suburb"
                className={`${inputClass} flex-1 text-sm`}
                autoFocus
              />
              <select
                value={draftState}
                onChange={(e) => setDraftState(e.target.value)}
                className={`${inputClass} w-24 text-sm`}
              >
                <option value="">State</option>
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <SaveCancel field="location" />
          </div>
        )}
      </div>

      {/* Public title — locked, set by QOAT AI */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant/50">
          Public title — set by QOAT
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
          {initialTitle}
          <AiBadge />
        </h1>
      </div>

      {/* Private nickname — optional, owner-editable */}
      {editing === "nickname" ? (
        <div className="space-y-1">
          <p className="text-xs text-on-surface-variant">Your personal label (only visible to you)</p>
          <input
            type="text"
            value={draftNickname}
            onChange={(e) => setDraftNickname(e.target.value)}
            placeholder="e.g. Kitchen reno quote from Mark"
            maxLength={100}
            className={`${inputClass} text-sm`}
            autoFocus
          />
          <SaveCancel field="nickname" />
        </div>
      ) : nickname ? (
        <p className="text-sm text-on-surface-variant italic">
          &ldquo;{nickname}&rdquo;
          <EditButton onClick={() => startEdit("nickname")} />
        </p>
      ) : (
        <button
          type="button"
          onClick={() => startEdit("nickname")}
          className="text-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors underline underline-offset-2"
        >
          + Add a personal label
        </button>
      )}

      {/* Description */}
      {editing === "description" ? (
        <div className="space-y-1">
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={3}
            placeholder="Any context about this quote…"
            className={`${inputClass} resize-none text-sm`}
            autoFocus
          />
          <SaveCancel field="description" />
        </div>
      ) : description ? (
        <p className="text-on-surface-variant">
          {description}
          <EditButton onClick={() => startEdit("description")} />
        </p>
      ) : (
        <button
          type="button"
          onClick={() => startEdit("description")}
          className="text-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors underline underline-offset-2"
        >
          + Add description
        </button>
      )}

      <QuoteOwnerActions
        quoteId={quoteId}
        initialStatus={initialStatus}
      />
    </header>
  );
}
