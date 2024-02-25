export interface MakerName {
    forename: string,
    surname: string,
}

export function normaliseName(text: string): string {
    if (!text) {
        return "";
    } else {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }
}

export function isSameAs(first: MakerName, second: MakerName): boolean {
    return normaliseName(first.forename) === normaliseName(second.forename) &&
        normaliseName(first.surname) === normaliseName(second.surname);
}

/* 
mightBeSameAs is like isSameAs but allows for alternate name formats
such as Asian family names and makers with only one name

example: Park Sohee is same as Sohee Park
example: Sting (no surname) is same as Sting (no forename)
*/
export function mightBeSameAs(first: MakerName, second: MakerName): boolean {
    // TO DO: implement this
    return normaliseName(first.forename) === normaliseName(second.forename) &&
        normaliseName(first.surname) === normaliseName(second.surname);
}
