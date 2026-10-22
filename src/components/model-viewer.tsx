"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";

type Props = { src: string; format: string; rotation?: [number,number,number]; zoom?: number };
export default function ModelViewer({ src, format, rotation = [0,0,0], zoom = 1 }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let cancelled = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x24282f);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100000);
    camera.position.set(2, 2, 3);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x505a70, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 10, 7);
    scene.add(light);
    const observe = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });
    observe.observe(host);
    const frame = new THREE.Group();
    scene.add(frame);
    const controller = new AbortController();
    async function load() {
      try {
        setError("");
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) throw new Error("Impossible de charger cette pièce");
        const buffer = await response.arrayBuffer();
        if (cancelled) return;
        let object: THREE.Object3D;
        switch (format.toLowerCase()) {
          case "stl": {
            const geometry = new STLLoader().parse(buffer);
            geometry.computeVertexNormals();
            object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xc8d4e5, metalness: 0.12, roughness: 0.7, side: THREE.DoubleSide }));
            break;
          }
          case "obj":
            object = new OBJLoader().parse(new TextDecoder().decode(buffer));
            object.traverse(child => {
              if (child instanceof THREE.Mesh) child.material = new THREE.MeshStandardMaterial({ color: 0xc8d4e5, side: THREE.DoubleSide });
            });
            break;
          case "3mf":
            object = new ThreeMFLoader().parse(buffer);
            break;
          default:
            throw new Error("Format non pris en charge");
        }
        frame.add(object);
        object.rotation.set(THREE.MathUtils.degToRad(rotation[0]), THREE.MathUtils.degToRad(rotation[1]), THREE.MathUtils.degToRad(rotation[2]));
        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        if (bounds.isEmpty()) throw new Error("La pièce est vide");
        object.position.sub(center);
        const radius = Math.max(size.length() * 0.75, 0.01);
        camera.position.set(radius / zoom, radius * 0.7 / zoom, radius / zoom);
        camera.near = Math.max(radius / 1000, 0.001);
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
      } catch (cause) {
        if (!cancelled && !(cause instanceof DOMException && cause.name === "AbortError"))
          setError(cause instanceof Error ? cause.message : "Erreur de visualisation");
      }
    }
    void load();
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelled = true;
      controller.abort();
      cancelAnimationFrame(animationId);
      observe.disconnect();
      controls.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src, format, rotation[0], rotation[1], rotation[2], zoom]);
  return <div className="relative h-[420px] overflow-hidden rounded-xl border border-current/10" ref={container} role="img" aria-label="Prévisualisation interactive de la pièce">
    {error && <p className="absolute bottom-3 left-3 rounded bg-black/80 p-2 text-sm text-white">{error}</p>}
  </div>;
}
