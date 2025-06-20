import React, { useEffect, useState, useCallback } from "react";
import { useUserAuth } from "../context/UserAuthContext";
import BottomNavigation from "./BottomNavigation";
import LogoutButton from "./LogoutBottom";
import LogoFixa from "./LogoFixa";
import API_BASE_URL from "../api";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

const Perfil = () => {
  const { user, refreshUserData, token } = useUserAuth();

  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [error, setError] = useState("");
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [recompensasObtidas, setRecompensasObtidas] = useState([]);
  const [loadingAvatarId, setLoadingAvatarId] = useState(null);
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const fetchUserBio = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.bio) setBio(data.bio);
    } catch (err) {
      console.error("Erro ao buscar bio:", err);
    }
  };

  const saveUserBio = async () => {
    setSavingBio(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bio`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio }),
      });
      if (response.ok) setEditingBio(false);
    } catch (err) {
      console.error("Erro ao salvar bio:", err);
    } finally {
      setSavingBio(false);
    }
  };

  const fetchUserPosts = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.posts)) {
        const userPosts = data.posts.filter(post => post.author?._id === user._id);
        setPosts(userPosts);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    }
  }, [user, token]);

  const fetchRecompensasObtidas = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/recompensas/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setRecompensasObtidas(data.obtidas || []);
      }
    } catch (err) {
      console.error("Erro ao buscar recompensas:", err);
    }
  }, [user, token]);

  useEffect(() => {
    if (user?._id) {
      refreshUserData();
      fetchUserPosts();
      fetchRecompensasObtidas();
      fetchUserBio();
    }
  }, [user, refreshUserData, fetchUserPosts, fetchRecompensasObtidas]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const startEditing = (post) => {
    setEditingPostId(post._id);
    setEditingContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditingContent("");
    setError("");
  };

  const saveEditing = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${editingPostId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editingContent }),
      });
      if (response.ok) {
        cancelEditing();
        fetchUserPosts();
      } else {
        const data = await response.json();
        setError(data.msg || "Erro ao salvar");
      }
    } catch (err) {
      setError("Erro: " + err.message);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Tem certeza que deseja excluir o post?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchUserPosts();
    } catch (err) {
      setError("Erro: " + err.message);
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarOptions(prev => !prev);
  };

  const handleAvatarSelect = async (titulo) => {
    setLoadingAvatarId(titulo);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recompensas/avatar/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo }),
      });
      if (response.ok) {
        await refreshUserData();
        setShowAvatarOptions(false);
      }
    } catch (err) {
      alert("Erro ao mudar avatar: " + err.message);
    }
    setLoadingAvatarId(null);
  };

  const normalizeIconUrl = (iconUrl, titulo) => {
    if (!iconUrl) return `/assets/img/${titulo.toLowerCase()}.png`;
    return iconUrl.startsWith("/") ? iconUrl : `/assets/img/${titulo.toLowerCase()}.png`;
  };

  if (!user) return <div>Carregando...</div>;

  const avatar = user.avatarSelecionado?.iconUrl ? (
    <img
      src={normalizeIconUrl(user.avatarSelecionado.iconUrl, user.avatarSelecionado.titulo)}
      alt="Avatar"
      style={{ width: 120, height: 120, borderRadius: "50%" }}
    />
  ) : (
    <span style={{ fontSize: 48, color: "#fff", fontWeight: "bold" }}>
      {user.name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );

  return (
    <div style={{
      padding: "20px 16px 90px",
      maxWidth: 600,
      margin: "0 auto",
      fontFamily: "'Segoe UI', sans-serif",
      backgroundColor: "#fff",
    }}>
      <LogoFixa />

      <header style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div onClick={handleAvatarClick} style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: "#8a2be2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            {avatar}
          </div>

          {showAvatarOptions && (
            <div style={{
              marginTop: 12,
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              maxWidth: 280,
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}>
              {recompensasObtidas.map((r) => (
                <button key={r.titulo} onClick={() => handleAvatarSelect(r.titulo)} disabled={loadingAvatarId !== null}
                  style={{
                    width: 40,
                    height: 40,
                    padding: 0,
                    background: "none",
                    border: "none",
                    borderRadius: "50%",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}>
                  {loadingAvatarId === r.titulo ? (
                    <div className="spinner" />
                  ) : (
                    <img src={normalizeIconUrl(r.iconUrl, r.titulo)} alt={r.titulo}
                      style={{ width: 40, height: 40, objectFit: "contain" }} />
                  )}
                </button>
              ))}
            </div>
          )}

          <h2 style={{ marginTop: 12, marginBottom: 4 }}>{user.name}</h2>
          <p style={{ margin: 0, color: "#666" }}>@{user.username}</p>

          <div style={{ marginTop: 8, textAlign: "center", fontSize: 14, color: "#444" }}>
            {editingBio ? (
              <>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                  rows={2} style={{
                    width: "90%", borderRadius: 8, padding: 6, fontSize: 14, border: "1px solid #ccc",
                  }} />
                <FaSave onClick={saveUserBio} style={{
                  marginLeft: 8, cursor: savingBio ? "not-allowed" : "pointer", color: "green",
                }} title="Salvar Bio" />
              </>
            ) : (
              <>
                <span>{bio || "Adicione sua bio"}</span>
                <FaEdit onClick={() => setEditingBio(true)} style={{
                  marginLeft: 8, cursor: "pointer", color: "#0579b2"
                }} title="Editar Bio" />
              </>
            )}
          </div>

          <div style={{
            marginTop: 10,
            backgroundColor: "#0579b2",
            padding: "4px 12px",
            borderRadius: 20,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
          }}>
            {user.pontos ?? 0} Bubbles 🫧
          </div>
        </div>
      </header>

      <section style={{ padding: "0 8px" }}>
        <h3 style={{
          textAlign: "center", fontSize: 18, color: "#0579b2", marginBottom: 12
        }}>Minhas Postagens</h3>

        <div style={{ maxHeight: "40vh", overflowY: "auto", paddingRight: 6 }}>
          {posts.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666" }}>Você ainda não postou nada.</p>
          ) : posts.map((post) => (
            <div key={post._id} style={{
              border: "1px solid #e0e0e0",
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              backgroundColor: "#f9fbff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              position: "relative",
            }}>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
                {formatDateTime(post.createdAt)}
              </div>
              {editingPostId === post._id ? (
                <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)}
                  rows={3} style={{
                    width: "100%", borderRadius: 8, padding: 6, fontSize: 14, border: "1px solid #ccc",
                  }} />
              ) : (
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{post.content}</p>
              )}

              <div style={{
                position: "absolute", top: 10, right: 10, display: "flex", gap: 12, fontSize: 16,
                color: "#0579b2", cursor: "pointer",
              }}>
                {editingPostId === post._id ? (
                  <>
                    <FaSave onClick={saveEditing} title="Salvar" />
                    <FaTimes onClick={cancelEditing} title="Cancelar" />
                  </>
                ) : (
                  <>
                    <FaEdit onClick={() => startEditing(post)} title="Editar" />
                    <FaTrash onClick={() => deletePost(post._id)} title="Excluir" />
                  </>
                )}
              </div>
              {error && editingPostId === post._id && (
                <div style={{ color: "red", marginTop: 4 }}>{error}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <LogoutButton />
      <BottomNavigation />
    </div>
  );
};

export default Perfil;
