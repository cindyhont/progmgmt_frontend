import { EntityId } from "@reduxjs/toolkit"

const useCloneSingleTableColumn = () => {
    const cloneColumn = (columnID:EntityId) => {
        const 
            originalModule = document.getElementById(`${columnID}`),
            {left,top,width,height} = originalModule.getBoundingClientRect(),
            table = document.createElement('table'),
            thead = document.createElement('thead'),
            headTr = document.createElement('tr'),
            newTh = originalModule.cloneNode(true) as HTMLTableCellElement

        headTr.style.cssText = originalModule.parentElement.style.cssText
        thead.style.cssText = originalModule.parentElement.parentElement.style.cssText
        table.style.cssText = originalModule.parentElement.parentElement.parentElement.style.cssText

        newTh.style.width = `${width}px`
        newTh.style.height = `${height}px`
        newTh.style.cursor = 'grabbing'
        headTr.appendChild(newTh)
        thead.appendChild(headTr)

        const 
            plusCell = document.getElementById(`task-board-add-column-task-${columnID}`).cloneNode(true),
            plusRow = document.createElement('tr')

        plusRow.appendChild(plusCell)
        thead.appendChild(plusRow)
        
        table.appendChild(thead)

        const 
            tbody = document.getElementById(`task-board-table-body-column-${columnID}`).cloneNode(true),
            newTr = document.createElement('tr')
        newTr.appendChild(tbody)
        table.appendChild(newTr)
        
        table.style.left = `${left}px`
        table.style.top = `${top}px`

        return table
    }

    return cloneColumn
}

export default useCloneSingleTableColumn