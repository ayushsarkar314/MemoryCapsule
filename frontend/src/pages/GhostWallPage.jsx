import { useState, useEffect, useCallback } from 'react';
import { differenceInSeconds } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ShaderBackground from '../components/ShaderBackground';
import './GhostWallPage.css';

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
];

const REACTIONS = [
  ['heart', '❤️'],
  ['ghost', '👻'],
  ['fire', '🔥'],
];

const GhostTimer = ({ expiresAt }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const secs = differenceInSeconds(
        new Date(expiresAt),
        new Date()
      );

      if (secs <= 0) {
        setRemaining('Expired');
        return;
      }

      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;

      setRemaining(
        h > 0
          ? `${h}h ${m}m`
          : m > 0
            ? `${m}m ${s}s`
            : `${s}s`
      );
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="gw-timer">
      ⏳ {remaining}
    </div>
  );
};

const GhostWallPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCompose, setShowCompose] = useState(false);
  const [contentType, setContentType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/ghost');
      setPosts(res.data.posts);
    } catch {
      toast.error('Could not load Ghost Wall');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const interval = setInterval(fetchPosts, 30000);

    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setMediaFile(acceptedFiles[0]);
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    maxFiles: 1,
  });

  const handleReact = async (postId, reaction) => {
    try {
      const res = await api.post(
        `/ghost/${postId}/react`,
        { reaction }
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                reactions: res.data.reactions,
              }
            : post
        )
      );
    } catch {
      toast.error('Could not react');
    }
  };

  const handleSubmit = async () => {
    if (
      contentType === 'text' &&
      !textContent.trim()
    ) {
      toast.error('Write something first');
      return;
    }

    if (
      contentType === 'image' &&
      !mediaFile
    ) {
      toast.error('Please select an image');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('contentType', contentType);
      formData.append('expiryHours', expiryHours);

      if (contentType === 'text') {
        formData.append(
          'textContent',
          textContent
        );
      }

      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      await api.post('/ghost', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('👻 Ghost post released!');

      setShowCompose(false);
      setTextContent('');
      setMediaFile(null);
      setExpiryHours(24);
      setContentType('text');

      fetchPosts();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not post'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="lp-root"
      style={{
        minHeight: '100vh',
        position: 'relative',
      }}
    >

      {/* =====================================================
          SAME BACKGROUND AS CREATE / SHARED PAGE
          ===================================================== */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>


      {/* =====================================================
          GHOST WALL CONTENT
          ===================================================== */}
      <div className="gw-content">

        <main className="gw-container">

          {/* ================= HEADER ================= */}

          <header className="gw-header">

            
 <h1 className="gw-title" style={{ color: "black" }}>
  Ghost Wall
</h1>
            <p className="gw-subtitle">
              Anonymous. Temporary. Honest.
            </p>

            <button
              type="button"
              className="gw-top-button"
              onClick={() =>
                setShowCompose(
                  (current) => !current
                )
              }
            >
              {showCompose
                ? '✕ Cancel'
                : '+ Post a Ghost Message'}
            </button>

          </header>


          {/* ================= COMPOSER ================= */}

          {showCompose && (
            <section className="gw-card gw-composer">

              <div className="gw-card-header">
                <h2>
                  Release your ghost
                </h2>

                <p>
                  Say something. Let it disappear.
                </p>
              </div>


              {/* CONTENT TYPE */}

              <div className="gw-field">

                <label className="gw-label">
                  What are you releasing?
                </label>

                <div className="gw-segmented">

                  <button
                    type="button"
                    className={
                      contentType === 'text'
                        ? 'gw-segment active'
                        : 'gw-segment'
                    }
                    onClick={() => {
                      setContentType('text');
                      setMediaFile(null);
                    }}
                  >
                    📝 Text
                  </button>

                  <button
                    type="button"
                    className={
                      contentType === 'image'
                        ? 'gw-segment active'
                        : 'gw-segment'
                    }
                    onClick={() =>
                      setContentType('image')
                    }
                  >
                    🖼️ Image
                  </button>

                </div>

              </div>


              {/* TEXT */}

              {contentType === 'text' && (
                <div className="gw-field gw-text-field">

                  <textarea
                    className="gw-textarea"
                    placeholder="What's haunting you tonight…"
                    value={textContent}
                    onChange={(e) =>
                      setTextContent(e.target.value)
                    }
                    rows={5}
                    maxLength={1000}
                  />

                  <span className="gw-character-count">
                    {textContent.length}/1000
                  </span>

                </div>
              )}


              {/* IMAGE */}

              {contentType === 'image' && (
                <div
                  {...getRootProps()}
                  className={
                    isDragActive
                      ? 'gw-upload gw-upload-active'
                      : 'gw-upload'
                  }
                >

                  <input {...getInputProps()} />

                  {mediaFile ? (
                    <>
                      <div className="gw-upload-icon success">
                        ✓
                      </div>

                      <strong>
                        {mediaFile.name}
                      </strong>

                      <span>
                        Click to choose another image
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="gw-upload-icon">
                        🖼️
                      </div>

                      <strong>
                        {isDragActive
                          ? 'Drop it here'
                          : 'Drop your image here'}
                      </strong>

                      <span>
                        or click to browse
                      </span>

                      <small>
                        PNG, JPG or WEBP
                      </small>
                    </>
                  )}

                </div>
              )}


              {/* EXPIRY */}

              <div className="gw-field gw-expiry-field">

                <label className="gw-label">
                  Disappears after
                </label>

                <div className="gw-expiry-grid">

                  {EXPIRY_OPTIONS.map(
                    ({ label, value }) => (
                      <button
                        type="button"
                        key={value}
                        className={
                          expiryHours === value
                            ? 'gw-expiry active'
                            : 'gw-expiry'
                        }
                        onClick={() =>
                          setExpiryHours(value)
                        }
                      >
                        {label}
                      </button>
                    )
                  )}

                </div>

              </div>


              {/* RELEASE */}

              <button
                type="button"
                className="gw-release"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? '👻 Releasing…'
                  : '👻 Release into the Wall'}
              </button>

            </section>
          )}


          {/* ================= POSTS ================= */}

          {loading ? (

            <div className="gw-post-list">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="gw-card gw-skeleton-card"
                >
                  <div className="gw-skeleton gw-skeleton-lg" />
                  <div className="gw-skeleton" />
                  <div className="gw-skeleton gw-skeleton-sm" />
                </div>
              ))}

            </div>

          ) : posts.length === 0 ? (

            <section className="gw-card gw-empty">

              <div className="gw-empty-icon">
                🌫️
              </div>

              <h2>
                The wall is empty
              </h2>

              <p>
                Be the first to haunt it with a
                message.
              </p>

              <button
                type="button"
                className="gw-empty-button"
                onClick={() =>
                  setShowCompose(true)
                }
              >
                Leave the first ghost
              </button>

            </section>

          ) : (

            <div className="gw-post-list">

              {posts.map((post) => (

                <article
                  key={post._id}
                  className="gw-card gw-post"
                >

                  {post.contentType === 'text' ? (

                    <p className="gw-post-text">
                      {post.textContent}
                    </p>

                  ) : post.mediaUrl ? (

                    <img
                      src={post.mediaUrl}
                      alt="Ghost post"
                      className="gw-post-image"
                    />

                  ) : null}


                  <div className="gw-post-footer">

                    <GhostTimer
                      expiresAt={post.expiresAt}
                    />

                    <div className="gw-reactions">

                      {REACTIONS.map(
                        ([key, emoji]) => (

                          <button
                            type="button"
                            key={key}
                            className="gw-reaction"
                            onClick={() =>
                              handleReact(
                                post._id,
                                key
                              )
                            }
                          >

                            <span>
                              {emoji}
                            </span>

                            {post.reactions?.[key] > 0 && (
                              <span>
                                {post.reactions[key]}
                              </span>
                            )}

                          </button>

                        )
                      )}

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </main>

      </div>

    </div>
  );
};

export default GhostWallPage;