import { getAdminContent } from "@/lib/admin-data";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { SITE_ASSET_TYPES, siteAssetTypeLabel } from "@/lib/site-assets";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

import {
  createAlbumAction,
  createProfileAction,
  deleteAlbumAction,
  deleteMediaAction,
  deleteProfileAction,
  deleteSiteAssetAction,
  loginAction,
  logoutAction,
  updateAlbumAction,
  updateBookingRequestStatusAction,
  updateMediaAction,
  updateNotesAction,
  updateProfileAction,
  updateScheduleAction,
  updateSettingsAction,
  updateSiteAssetAction,
  uploadMediaAction,
  uploadSiteAssetAction,
} from "./actions";

function scheduleValue(content: Awaited<ReturnType<typeof getAdminContent>>) {
  return content.schedule.map((item) => `${item.displayTime} | ${item.label}`).join("\n");
}

function notesValue(content: Awaited<ReturnType<typeof getAdminContent>>) {
  return content.notes.map((note) => note.text).join("\n");
}

function shortTimestamp(value: string) {
  return value ? value.slice(0, 16).replace("T", " ") : "";
}

function Login() {
  return (
    <main className="login-stage">
      <div className="login-card">
        <h1>Admin</h1>
        {!isAdminPasswordConfigured() ? <p>Set ADMIN_PASSWORD first.</p> : null}
        <form action={loginAction} className="admin-form">
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" />
          </label>
          <button className="admin-button" type="submit">
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <Login />;
  }

  const content = await getAdminContent();
  const supabaseReady = isSupabaseAdminConfigured();

  return (
    <main className="admin-shell">
      <section className="admin-panel">
        <div className="admin-actions">
          <h1>Management</h1>
          <form action={logoutAction}>
            <button className="admin-button admin-button--quiet" type="submit">
              Exit
            </button>
          </form>
        </div>

        {!supabaseReady ? (
          <div className="admin-card" style={{ marginTop: 24 }}>
            Supabase admin env is not configured. The public site is using local seed content.
          </div>
        ) : null}

        <div className="admin-grid">
          <div className="admin-stack">
            <section className="admin-card">
              <h2>Profiles</h2>
              <form action={createProfileAction} className="admin-form">
                <label>
                  Name
                  <input name="name" />
                </label>
                <label>
                  Slug
                  <input name="slug" />
                </label>
                <label>
                  Status
                  <input name="status" defaultValue="Available" />
                </label>
                <label>
                  Schedule
                  <textarea name="schedule" />
                </label>
                <label>
                  Intro
                  <textarea name="intro" />
                </label>
                <label>
                  Description
                  <textarea name="description" />
                </label>
                <label>
                  Order
                  <input name="sortOrder" type="number" defaultValue="100" />
                </label>
                <label>
                  Enabled
                  <input name="enabled" type="checkbox" defaultChecked />
                </label>
                <button className="admin-button" type="submit">
                  Create Profile
                </button>
              </form>

              <div className="admin-list">
                {content.profiles.map((profile) => (
                  <article className="admin-row" key={profile.id}>
                    <strong>{profile.name}</strong>
                    <span>/moments/{profile.slug}</span>
                    <form action={updateProfileAction} className="admin-form" encType="multipart/form-data">
                      <input name="id" type="hidden" value={profile.id} />
                      <input name="coverStoragePath" type="hidden" value={profile.coverStoragePath ?? ""} />
                      <label>
                        Name
                        <input name="name" defaultValue={profile.name} />
                      </label>
                      <label>
                        Slug
                        <input name="slug" defaultValue={profile.slug} />
                      </label>
                      <label>
                        Cover Image
                        <input name="file" type="file" accept="image/*" />
                      </label>
                      <label>
                        Status
                        <input name="status" defaultValue={profile.status} />
                      </label>
                      <label>
                        Schedule
                        <textarea name="schedule" defaultValue={profile.schedule} />
                      </label>
                      <label>
                        Intro
                        <textarea name="intro" defaultValue={profile.intro ?? ""} />
                      </label>
                      <label>
                        Description
                        <textarea name="description" defaultValue={profile.description ?? ""} />
                      </label>
                      <label>
                        Order
                        <input name="sortOrder" type="number" defaultValue={profile.sortOrder} />
                      </label>
                      <label>
                        Enabled
                        <input name="enabled" type="checkbox" defaultChecked={profile.enabled} />
                      </label>
                      <div className="admin-actions">
                        <button className="admin-button" type="submit">
                          Save Profile
                        </button>
                        <button className="admin-button admin-button--quiet" formAction={deleteProfileAction} type="submit">
                          Delete Profile
                        </button>
                      </div>
                    </form>

                    <form action={createAlbumAction} className="admin-form">
                      <input name="profileId" type="hidden" value={profile.id} />
                      <label>
                        Album Title
                        <input name="title" />
                      </label>
                      <label>
                        Album Slug
                        <input name="slug" />
                      </label>
                      <label>
                        Note
                        <textarea name="note" />
                      </label>
                      <label>
                        Date
                        <input name="albumDate" type="date" />
                      </label>
                      <label>
                        Order
                        <input name="sortOrder" type="number" defaultValue="100" />
                      </label>
                      <label>
                        Published
                        <input name="isPublished" type="checkbox" defaultChecked />
                      </label>
                      <button className="admin-button" type="submit">
                        Create Album
                      </button>
                    </form>

                    {profile.albums.length ? (
                      <div className="admin-list admin-list--nested">
                        {profile.albums.map((album) => (
                          <article className="admin-row admin-row--nested" key={album.id}>
                            <strong>{album.title}</strong>
                            <span>
                              /moments/{profile.slug}/{album.slug}
                            </span>
                            <form action={updateAlbumAction} className="admin-form">
                              <input name="id" type="hidden" value={album.id} />
                              <input name="profileId" type="hidden" value={profile.id} />
                              <label>
                                Title
                                <input name="title" defaultValue={album.title} />
                              </label>
                              <label>
                                Slug
                                <input name="slug" defaultValue={album.slug} />
                              </label>
                              <label>
                                Note
                                <textarea name="note" defaultValue={album.note ?? ""} />
                              </label>
                              <label>
                                Date
                                <input name="albumDate" type="date" defaultValue={album.albumDate ?? ""} />
                              </label>
                              <label>
                                Order
                                <input name="sortOrder" type="number" defaultValue={album.sortOrder} />
                              </label>
                              <label>
                                Published
                                <input name="isPublished" type="checkbox" defaultChecked={album.isPublished} />
                              </label>
                              <div className="admin-actions">
                                <button className="admin-button" type="submit">
                                  Save Album
                                </button>
                                <button className="admin-button admin-button--quiet" formAction={deleteAlbumAction} type="submit">
                                  Delete Album
                                </button>
                              </div>
                            </form>

                            <form action={uploadMediaAction} className="admin-form" encType="multipart/form-data">
                              <input name="albumId" type="hidden" value={album.id} />
                              <label>
                                Upload Media
                                <input name="file" type="file" accept="image/*,video/*" />
                              </label>
                              <label>
                                Alt
                                <input name="alt" />
                              </label>
                              <label>
                                Order
                                <input name="sortOrder" type="number" defaultValue="100" />
                              </label>
                              <label>
                                Cover
                                <input name="isCover" type="checkbox" />
                              </label>
                              <button className="admin-button" type="submit">
                                Upload Media
                              </button>
                            </form>

                            {album.media.length ? (
                              <div className="admin-list">
                                {album.media.map((item) => (
                                  <form action={updateMediaAction} className="admin-form" key={item.id}>
                                    <input name="id" type="hidden" value={item.id} />
                                    <input name="albumId" type="hidden" value={album.id} />
                                    <input name="storagePath" type="hidden" value={item.storagePath ?? ""} />
                                    <label>
                                      Alt
                                      <input name="alt" defaultValue={item.alt} />
                                    </label>
                                    <label>
                                      Order
                                      <input name="sortOrder" type="number" defaultValue={item.sortOrder} />
                                    </label>
                                    <label>
                                      Cover
                                      <input name="isCover" type="checkbox" defaultChecked={item.isCover} />
                                    </label>
                                    <div className="admin-actions">
                                      <button className="admin-button" type="submit">
                                        Save Media
                                      </button>
                                      <button className="admin-button admin-button--quiet" formAction={deleteMediaAction} type="submit">
                                        Delete Media
                                      </button>
                                    </div>
                                  </form>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="admin-stack">
            <section className="admin-card">
              <h2>Booking Requests</h2>
              {content.bookingRequests.length ? (
                <div className="admin-list">
                  {content.bookingRequests.map((request) => (
                    <form action={updateBookingRequestStatusAction} className="admin-form booking-request-row" key={request.id}>
                      <input name="id" type="hidden" value={request.id} />
                      <strong>{request.profileSlug}</strong>
                      {request.albumSlug ? <span>{request.albumSlug}</span> : null}
                      <span>{shortTimestamp(request.createdAt)}</span>
                      <span>{request.date} {request.time}</span>
                      <span>{request.duration}</span>
                      <span>{request.contact}</span>
                      {request.message ? <p>{request.message}</p> : null}
                      <label>
                        Status
                        <select name="status" defaultValue={request.status}>
                          <option value="new">new</option>
                          <option value="reviewed">reviewed</option>
                          <option value="archived">archived</option>
                        </select>
                      </label>
                      <button className="admin-button" type="submit">
                        Update
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="admin-muted">No booking requests.</p>
              )}
            </section>

            <section className="admin-card">
              <h2>Site Assets</h2>
              <form action={uploadSiteAssetAction} className="admin-form" encType="multipart/form-data">
                <label>
                  Asset type
                  <select name="assetType" defaultValue="hero_polaroid">
                    {SITE_ASSET_TYPES.map((assetType) => (
                      <option key={assetType} value={assetType}>
                        {siteAssetTypeLabel(assetType)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  File
                  <input name="file" type="file" accept="image/*,video/*" />
                </label>
                <label>
                  Alt text
                  <input name="altText" />
                </label>
                <label>
                  Order
                  <input name="sortOrder" type="number" defaultValue="100" />
                </label>
                <label>
                  Enabled
                  <input name="enabled" type="checkbox" defaultChecked />
                </label>
                <label>
                  Mobile visible
                  <input name="mobileVisibility" type="checkbox" defaultChecked />
                </label>
                <label>
                  Desktop visible
                  <input name="desktopVisibility" type="checkbox" defaultChecked />
                </label>
                <button className="admin-button" type="submit">
                  Upload Asset
                </button>
              </form>

              {content.assets.length ? (
                <div className="admin-list">
                  {content.assets.map((asset) => (
                    <form action={updateSiteAssetAction} className="admin-form" encType="multipart/form-data" key={asset.id}>
                      <input name="id" type="hidden" value={asset.id} />
                      <input name="storagePath" type="hidden" value={asset.storagePath ?? ""} />
                      <span>{asset.url ? <a href={asset.url}>Open asset</a> : "No file URL"}</span>
                      <label>
                        Asset type
                        <select name="assetType" defaultValue={asset.assetType}>
                          {SITE_ASSET_TYPES.map((assetType) => (
                            <option key={assetType} value={assetType}>
                              {siteAssetTypeLabel(assetType)}
                            </option>
                          ))}
                          </select>
                        </label>
                      <label>
                        Replace file
                        <input name="file" type="file" accept="image/*,video/*" />
                      </label>
                      <label>
                        Alt text
                        <input name="altText" defaultValue={asset.altText} />
                      </label>
                      <label>
                        Order
                        <input name="sortOrder" type="number" defaultValue={asset.sortOrder} />
                      </label>
                      <label>
                        Enabled
                        <input name="enabled" type="checkbox" defaultChecked={asset.enabled} />
                      </label>
                      <label>
                        Mobile visible
                        <input name="mobileVisibility" type="checkbox" defaultChecked={asset.mobileVisibility} />
                      </label>
                      <label>
                        Desktop visible
                        <input name="desktopVisibility" type="checkbox" defaultChecked={asset.desktopVisibility} />
                      </label>
                      <div className="admin-actions">
                        <button className="admin-button" type="submit">
                          Save Asset
                        </button>
                        <button className="admin-button admin-button--quiet" formAction={deleteSiteAssetAction} type="submit">
                          Delete Asset
                        </button>
                      </div>
                    </form>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="admin-card">
              <h2>Tonight</h2>
              <form action={updateScheduleAction} className="admin-form">
                <label>
                  Lines
                  <textarea name="schedule" defaultValue={scheduleValue(content)} />
                </label>
                <button className="admin-button" type="submit">
                  Save
                </button>
              </form>
            </section>

            <section className="admin-card">
              <h2>Notes</h2>
              <form action={updateNotesAction} className="admin-form">
                <label>
                  Lines
                  <textarea name="notes" defaultValue={notesValue(content)} />
                </label>
                <button className="admin-button" type="submit">
                  Save
                </button>
              </form>
            </section>

            <section className="admin-card">
              <h2>Settings</h2>
              <form action={updateSettingsAction} className="admin-form">
                <label>
                  Home note
                  <input name="heroNote" defaultValue={content.settings.heroNote} />
                </label>
                <label>
                  Moments note
                  <input name="momentsNote" defaultValue={content.settings.momentsNote} />
                </label>
                <label>
                  Footer
                  <input name="footerLine" defaultValue={content.settings.footerLine} />
                </label>
                <button className="admin-button" type="submit">
                  Save
                </button>
              </form>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
