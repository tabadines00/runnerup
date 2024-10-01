import Link from "next/link";

export default function Home() {
    return (
        <div>
            <main>
                <h1>Choose Your editor!</h1>
                <div className="flex flex-row">
                    <div>
                        <Link href="/term/py">Python</Link>
                    </div>
                    <div>
                        <Link href="/term/js">Javascript</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}