"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";

type Props = { modelId: string; fileId: string; format: string; rotation: [number, number, number]; zoom: number };
let active = 0;
const pending: Array<() => void> = [];
function acquire() {
  return new Promise<() => void>(resolve => {
    const take = () => { active++; resolve(() => { active--; pending.shift()?.(); }); };
    if (active < 2) take(); else pending.push(take);
  });
}
async function generate(props: Props, signal: AbortSignal) {
  const release = await acquire();
  let renderer: THREE.WebGLRenderer | undefined;
  let object: THREE.Object3D | undefined;
  try {
    if (signal.aborted) return false;
    const url = "/api/models/" + props.modelId + "/files/" + props.fileId + "/content";
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("File not available");
    const data = await response.arrayBuffer();
    if (signal.aborted) return false;
    switch (props.format.toLowerCase()) {
      case "stl":
        object = new THREE.Mesh(new STLLoader().parse(data),
          new THREE.MeshStandardMaterial({ color: 0xb9c8dc, side: THREE.DoubleSide }));
        break;
      case "obj":
        object = new OBJLoader().parse(new TextDecoder().decode(data));
        break;
      case "3mf":
        object = new ThreeMFLoader().parse(data);
        break;
      default: return false;
    }
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return false;
    const center = bounds.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const size = bounds.getSize(new THREE.Vector3());
    object.rotation.set(THREE.MathUtils.degToRad(props.rotation[0]), THREE.MathUtils.degToRad(props.rotation[1]), THREE.MathUtils.degToRad(props.rotation[2]));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x252b36);
    scene.add(object);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x515c72, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(5, 8, 9);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(45, 320 / 240, 0.01, 100000);
    const radius = Math.max(size.length() * 0.9, 0.1) / Math.max(props.zoom, 0.1);
    camera.position.set(radius, radius * 0.65, radius);
    camera.near = Math.max(radius / 1000, 0.001);
    camera.far = radius * 100;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, preserveDrawingBuffer: true });
    renderer.setSize(320, 240);
    renderer.render(scene, camera);
    const blob = await new Promise<Blob | null>(resolve => renderer!.domElement.toBlob(resolve, "image/png"));
    if (!blob || signal.aborted) return false;
    const save = await fetch("/api/models/" + props.modelId + "/thumbnail", {
      method: "POST", body: blob, headers: { "Content-Type": "image/png" }, signal,
    });
    return save.ok;
  } finally {
    if (object) object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        for (const mat of (Array.isArray(child.material) ? child.material : [child.material])) mat.dispose();
      }
    });
    renderer?.dispose();
    renderer?.forceContextLoss();
    release();
  }
}
export default function ModelThumbnail(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const { modelId, fileId, format, rotation, zoom } = props;
  const [rx, ry, rz] = rotation;
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "180px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const abort = new AbortController();
    void (async () => {
      try {
        const path = "/api/models/" + modelId + "/thumbnail";
        const cached = await fetch(path, { signal: abort.signal });
        if (cached.ok) { setSrc(path); return; }
        if (cached.status !== 404) return;
        if (await generate({ modelId, fileId, format, rotation: [rx, ry, rz], zoom }, abort.signal))
          setSrc(path + "?ready=1");
      } catch {
        if (!abort.signal.aborted) setFailed(true);
      }
    })();
    return () => abort.abort();
  }, [visible, modelId, fileId, format, rx, ry, rz, zoom]);
  return <div ref={host} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-current/[0.05]">
    {src && !failed ? <Image src={src} alt="" width={320} height={240} unoptimized className="h-full w-full object-cover" onError={() => setFailed(true)}/> :
      <div aria-hidden="true" className="flex flex-col items-center gap-2 text-current/40">
        <svg viewBox="0 0 48 48" className="size-12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M24 4 5 15v19l19 11 19-11V15L24 4Z"/><path d="M5 15 24 26l19-11M24 26v19"/>
        </svg><span className="text-xs">{failed ? "Aperçu indisponible" : "Chargement de l'aperçu"}</span>
      </div>}
  </div>;
}
