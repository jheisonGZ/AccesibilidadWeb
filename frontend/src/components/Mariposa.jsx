export default function Mariposa() {
  console.log("MARIPOSA FUNCIONANDO");

  return (
    <mesh position={[0, 2, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}