import Link from "next/link";
import { notFound } from "next/navigation";

import { MemoryPrint } from "@/components/memory-print";
import { PublicAgeGate } from "@/components/public-age-gate";
import { isAgeVerified } from "@/lib/age-gate";
import { getSiteContent } from "@/lib/data";

import { createBookingRequestAction } from "./actions";

type BookingPageProps = PageProps<"/booking">;

const durationOptions = ["1 hour", "2 hours", "3 hours", "Overnight"];

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const verified = await isAgeVerified();

  if (!verified) {
    return <PublicAgeGate />;
  }

  const query = await searchParams;
  const content = await getSiteContent();
  const profiles = content.profiles;
  const requestedProfileSlug = queryValue(query.profile);
  const selectedProfile = profiles.find((profile) => profile.slug === requestedProfileSlug) ?? profiles[0];

  if (!selectedProfile) {
    notFound();
  }

  const requestedAlbumSlug = queryValue(query.album);
  const selectedAlbum = selectedProfile.albums.find((album) => album.slug === requestedAlbumSlug);
  const submitted = queryValue(query.submitted) === "1";
  const invalid = queryValue(query.invalid) === "1";

  return (
    <PublicAgeGate initialVerified>
      <main className="site-shell booking-stage">
        <div className="ambient-grain" />
        <header className="booking-topline">
          <Link href={selectedAlbum ? `/moments/${selectedProfile.slug}/${selectedAlbum.slug}` : `/moments/${selectedProfile.slug}`}>
            {selectedAlbum ? selectedAlbum.title : selectedProfile.name}
          </Link>
          <h1>Booking</h1>
        </header>

        <section className="booking-shell" aria-label="Booking request">
          <aside className="booking-summary">
            <MemoryPrint
              media={
                selectedProfile.coverImage
                  ? {
                      mediaType: "image",
                      url: selectedProfile.coverImage,
                      alt: selectedProfile.name,
                    }
                  : undefined
              }
              tone={selectedProfile.coverTone}
              rotate="-2deg"
            />
            <div className="booking-summary__copy">
              <span className="profile-status">{selectedProfile.status}</span>
              <h2>{selectedProfile.name}</h2>
              {selectedProfile.schedule ? (
                <div className="profile-schedule">
                  {selectedProfile.schedule.split("\n").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              ) : null}
              {selectedAlbum ? <p>{selectedAlbum.title}</p> : null}
            </div>
          </aside>

          <form action={createBookingRequestAction} className="booking-form">
            {submitted ? (
              <div className="booking-message" role="status">
                <strong>Request received.</strong>
                <span>We will review it manually.</span>
              </div>
            ) : null}
            {invalid ? (
              <div className="booking-message booking-message--error" role="alert">
                <strong>Request not sent.</strong>
                <span>Check the required fields.</span>
              </div>
            ) : null}

            <label>
              Profile
              <select name="profile" defaultValue={selectedProfile.slug} required>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.slug}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Experience / Album
              <select name="album" defaultValue={selectedAlbum?.slug ?? ""}>
                <option value="">Select</option>
                {selectedProfile.albums.map((album) => (
                  <option key={album.id} value={album.slug}>
                    {album.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input name="date" type="date" required />
            </label>

            <label>
              Time
              <input name="time" type="time" required />
            </label>

            <label>
              Duration
              <select name="duration" defaultValue="1 hour" required>
                {durationOptions.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Contact
              <input name="contact" placeholder="Your preferred contact" required />
            </label>

            <label>
              Message
              <textarea name="message" />
            </label>

            <button className="booking-submit" type="submit">
              REQUEST BOOKING
            </button>

            <p className="booking-disclaimer">
              All requests are reviewed manually.
              <br />
              Submission does not guarantee availability.
            </p>
          </form>
        </section>
      </main>
    </PublicAgeGate>
  );
}
