import StringIO
from werkzeug.routing import BaseConverter
from flask import send_file


class IntListConverter(BaseConverter):

    def to_python(self, value):
        return map(int, value.split(','))

    def to_url(self, values):
        return ','.join(BaseConverter.to_url(value)
                        for value in values)


# from https://stackoverflow.com/questions/7877282/how-to-send-image-generated-by-pil-to-browser
def serve_pil_image(pil_img):
    img_io = StringIO.StringIO()
    pil_img.save(img_io, 'PNG', quality=90)
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')
