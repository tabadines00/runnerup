import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import DashRow from "./DashRow"

const Dashboard = ({dashboardProjects}) => {
    return (
        <Table>
            <TableCaption>A list of your projects.</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Name</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {dashboardProjects.map((item, idx)=>{
                    return(
                        <DashRow key={idx} data={item} />
                    )
                })}
            </TableBody>
        </Table>
    )
}

export default Dashboard