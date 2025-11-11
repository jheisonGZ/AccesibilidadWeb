import { AvatarGrid } from "@/components/avatar/avatar-grid"

export default function AvatarPage() {
  return (
    <div className="min-h-screen gradient-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Elige tu Avatar</h1>
          <p className="text-lg text-muted-foreground">
            Selecciona el avatar que mejor te represente en tu espacio de bienestar
          </p>
        </div>
        <AvatarGrid />
      </div>
    </div>
  )
}
