"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginBox() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")

  const clickLogin = (e) => {
    e.preventDefault()

    console.log(email, pass)
    // Make pass into password_hash
    // let password_hash = hash(pass)

    fetch("http://localhost:8787/login", {
      credentials: 'include',
      method: "POST",
      body: JSON.stringify({
        email: email,
        password_hash: pass // Will be changed to password_hash later
      }),
  })
    .then((response) => response.json())
    .then((result) => {
      if(result.success === true){
        //alert("You are logged in as "+result.response.username)
        router.push('/dash')
       } else {
        alert("Please check your login information.");
       }
    });
  }

  return (
    (<Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>Enter your email and password to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="me@example.com" value={email} onChange={(event) => {setEmail(event.target.value)}} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={pass} onChange={(event) => {setPass(event.target.value)}} required />
          </div>
          <Button type="submit" onClick={clickLogin} className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>)
  );
}
