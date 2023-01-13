import { EntityId } from "@reduxjs/toolkit"
import { useTheme } from "@mui/material";

const useCloneSingleTableColumn = () => {
    const 
        {palette:{background}} = useTheme(),
        cloneColumn = (field:EntityId) => {
            const
                thead = document.createElement('thead'),
                headTr = document.createElement('tr'),
                columnHead = document.querySelector(`th.${field}`) as HTMLTableCellElement,
                newTh = columnHead.cloneNode(true) as HTMLTableCellElement,
                table = document.createElement('table')

            headTr.style.cssText = columnHead.parentElement.style.cssText
            thead.style.cssText = columnHead.parentElement.parentElement.style.cssText
            table.style.cssText = columnHead.parentElement.parentElement.parentElement.style.cssText

            newTh.style.width = `${columnHead.getBoundingClientRect().width}px`

            headTr.appendChild(newTh)
            thead.appendChild(headTr)
            table.appendChild(thead)

            const 
                tbody = document.createElement('tbody'),
                originalTableBody = document.getElementById('task-list-table-body')
            tbody.style.cssText = originalTableBody.style.cssText

            const 
                bodyTr = document.createElement('tr'),
                tableRow = originalTableBody.querySelector('tr')
            bodyTr.style.cssText = tableRow.style.cssText

            const cells = originalTableBody.querySelectorAll(`.${field}`)
            cells.forEach(e=>{
                const 
                    cell = e.cloneNode(true) as HTMLTableCellElement,
                    rowTr = bodyTr.cloneNode(true)
                    
                cell.style.height = `${e.getBoundingClientRect().height}px`

                rowTr.appendChild(cell)
                tbody.appendChild(rowTr)
            })

            table.style.zIndex = '3'
            table.style.backgroundColor = background.default
            table.appendChild(tbody)

            return table
        }

    return cloneColumn
}

export default useCloneSingleTableColumn