import {
    TableCell,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"

const Page = ({data}) => {
    return (
        <TableRow>
            <TableCell className="font-medium">
                <Link href={"/term/py"}>
                    {data.title}
                </Link>
            </TableCell>
            <TableCell>{data.lang}</TableCell>
            <TableCell>{data.username}</TableCell>
            <TableCell className="text-right">{data.updated_at}</TableCell>
            <TableCell className="text-right">{data.created_at}</TableCell>
        </TableRow>
    )
}

export default Page

